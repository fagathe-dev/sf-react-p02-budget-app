<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\BoardCalculator;
use App\Calculator\Split\PercentageSplit;
use App\Calculator\Split\RemainderDistributor;
use App\Calculator\StrategyRegistry;
use App\Dto\Budget\AddMemberDto;
use App\Dto\Budget\UpdateMemberDto;
use App\Entity\Board;
use App\Entity\BoardMember;
use App\Enum\Budget\InvitationChannelEnum;
use App\Enum\Budget\MemberRoleEnum;
use App\Repository\BoardMemberRepository;
use App\Repository\BoardRepository;
use App\Repository\InvitationRepository;
use App\Repository\SplitRuleRepository;
use App\Security\Voter\BoardVoter;
use App\ValueObject\Period;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Mailer\Exception\MailerExceptionInterface;
use Fagathe\CorePhp\Mailer\Exception\RecipientUnreachableException;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Throwable;

/**
 * Membres d'un board : seul le propriétaire les gère (BoardVoter::MANAGE_MEMBERS).
 */
final class MemberService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly BoardMemberRepository $memberRepository,
        private readonly InvitationRepository $invitationRepository,
        private readonly SplitRuleRepository $splitRuleRepository,
        private readonly InvitationIssuer $invitationIssuer,
        private readonly SplitRuleWriter $splitRuleWriter,
        private readonly StrategyRegistry $registry,
        private readonly BoardCalculator $calculator,
    ) {}

    /**
     * POST /api/boards/{id}/members : un prénom (invité local), ou un e-mail qui reçoit une invitation.
     * Avant acceptation, le membre se comporte comme un invité local : sa part est calculée, rien ne remonte.
     */
    public function addMember(Request $request, string $boardId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::MANAGE_MEMBERS);
        if (!$board instanceof Board) {
            return $board;
        }

        if (!$this->registry->boardType($board->getType())->acceptsMembers()) {
            return $this->sendJson(['message' => 'Ce board n\'accepte pas d\'autres membres.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $dto = $this->deserializeDto($request->getContent(), AddMemberDto::class);
        if (!$dto instanceof AddMemberDto) {
            return $dto;
        }

        $email = $dto->email !== null && trim($dto->email) !== '' ? strtolower(trim($dto->email)) : null;
        if ($email !== null && $this->hasLinkedMemberWithEmail($board, $email)) {
            return $this->sendJson(['message' => 'Cette personne fait déjà partie du board.'], Response::HTTP_CONFLICT);
        }

        $member = (new BoardMember())
            ->setBoard($board)
            ->setDisplayName(trim($dto->displayName))
            ->setRole(MemberRoleEnum::from($dto->role));
        $email !== null ? $member->markInvited() : $member->activate($this->now());

        try {
            $this->memberRepository->save($member, isCreation: true);
            $url = null;

            if ($email !== null) {
                $url = $this->invitationIssuer->issue($board, $member, $this->getAuthenticatedUser(), InvitationChannelEnum::Email, $email)['url'];
            }

            $this->publish('board', $board->getId(), $email !== null ? 'board.member_invited' : 'board.member_added', [
                'memberId'    => (string) $member->getId(),
                'displayName' => $member->getDisplayName(),
                'email'       => $email,
            ]);

            return $this->sendJson(
                ['member' => $member, 'invitationSent' => $url !== null],
                Response::HTTP_CREATED,
                context: ['groups' => ['member.read']]
            );
        } catch (RecipientUnreachableException) {
            return $this->sendJson(
                ['message' => 'Le membre a été ajouté, mais le domaine de cette adresse ne peut pas recevoir d\'e-mails. Vous pourrez renvoyer une invitation.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        } catch (MailerExceptionInterface) {
            return $this->sendJson(
                ['message' => 'Le membre a été ajouté, mais l\'invitation n\'a pas pu être envoyée. Vous pourrez la renvoyer.'],
                Response::HTTP_BAD_GATEWAY
            );
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'ajout du membre.', 'board.member.add.error', $e, ['board_id' => $boardId]);
        }
    }

    /**
     * PUT /api/boards/{id}/members/{memberId} : prénom, rôle, et part (nouvelle règle « percentage » du board).
     */
    public function updateMember(Request $request, string $boardId, string $memberId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::MANAGE_MEMBERS);
        if (!$board instanceof Board) {
            return $board;
        }

        $member = $board->findMember($memberId);
        if (!$member || $member->isLeft()) {
            return $this->notFoundResponse('Membre introuvable.');
        }

        $dto = $this->deserializeDto($request->getContent(), UpdateMemberDto::class);
        if (!$dto instanceof UpdateMemberDto) {
            return $dto;
        }

        if ($dto->role !== null && $member->isOwner()) {
            return $this->sendViolations(['role' => 'Le rôle du propriétaire ne peut pas être modifié.']);
        }

        $period = $dto->effectiveFrom !== null ? Period::fromString($dto->effectiveFrom) : Period::current();
        $entries = $dto->shareBasisPoints !== null ? $this->buildShareEntries($board, $member, $dto->shareBasisPoints, $period) : null;
        if ($entries === []) {
            return $this->sendViolations(['shareBasisPoints' => 'Il faut au moins un autre membre pour modifier une part.']);
        }

        try {
            if ($dto->displayName !== null) {
                $member->setDisplayName(trim($dto->displayName));
            }
            if ($dto->role !== null) {
                $member->setRole(MemberRoleEnum::from($dto->role));
            }
            $this->memberRepository->save($member);

            if ($entries !== null) {
                $this->splitRuleWriter->write($board, null, $period, PercentageSplit::CODE, $entries, $this->getAuthenticatedUser());
            }

            $this->publish('board', $board->getId(), 'board.member_updated', [
                'memberId'         => (string) $member->getId(),
                'displayName'      => $member->getDisplayName(),
                'role'             => $member->getRole()->value,
                'shareBasisPoints' => $dto->shareBasisPoints,
                'effectiveFrom'    => $entries !== null ? $period->toString() : null,
            ]);

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $period)));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la modification du membre.', 'board.member.update.error', $e, ['member_id' => $memberId]);
        }
    }

    /**
     * DELETE /api/boards/{id}/members/{memberId} : le membre passe à « left », sa remontée s'arrête.
     */
    public function removeMember(string $boardId, string $memberId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::MANAGE_MEMBERS);
        if (!$board instanceof Board) {
            return $board;
        }

        $member = $board->findMember($memberId);
        if (!$member || $member->isLeft()) {
            return $this->notFoundResponse('Membre introuvable.');
        }

        if ($member->isOwner()) {
            return $this->sendJson(['message' => 'Le propriétaire ne peut pas être retiré du board.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $member->leave($this->now());
            foreach ($this->invitationRepository->findPendingForMember($member) as $invitation) {
                $this->invitationRepository->save($invitation->revoke(), flush: false);
            }
            $this->registry->boardType($board->getType())->onMemberLeft($member, Period::current());
            $this->memberRepository->save($member);

            $this->publish('board', $board->getId(), 'board.member_left', [
                'memberId'    => (string) $member->getId(),
                'displayName' => $member->getDisplayName(),
            ]);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du retrait du membre.', 'board.member.remove.error', $e, ['member_id' => $memberId]);
        }
    }

    /**
     * Le membre reçoit $basisPoints ; le reste va aux autres au prorata de leur part actuelle
     * (parts égales si la règle en vigueur n'est pas en pourcentage).
     *
     * @return list<array{memberId: string, value: int}>
     */
    private function buildShareEntries(Board $board, BoardMember $member, int $basisPoints, Period $period): array
    {
        $memberId = (string) $member->getId();
        $others = array_values(array_filter(
            $board->getSplittableMembers(),
            static fn (BoardMember $other): bool => (string) $other->getId() !== $memberId
        ));
        if ($others === []) {
            return [];
        }

        $currentRule = $this->splitRuleRepository->findBoardRuleAt($board, $period);
        $currentValues = $currentRule?->getStrategy() === PercentageSplit::CODE ? $currentRule->getValuesByMember() : [];

        $weights = [];
        foreach ($others as $other) {
            $weights[(string) $other->getId()] = (int) ($currentValues[(string) $other->getId()] ?? 1);
        }
        if (array_sum($weights) === 0) {
            $weights = array_map(static fn (): int => 1, $weights);
        }

        $entries = [['memberId' => $memberId, 'value' => $basisPoints]];
        foreach (RemainderDistributor::distribute(PercentageSplit::TOTAL_BASIS_POINTS - $basisPoints, $weights) + array_fill_keys(array_keys($weights), 0) as $otherId => $value) {
            $entries[] = ['memberId' => (string) $otherId, 'value' => $value];
        }

        return $entries;
    }

    private function hasLinkedMemberWithEmail(Board $board, string $email): bool
    {
        foreach ($board->getSplittableMembers() as $member) {
            if ($member->getUser() !== null && strtolower((string) $member->getUser()->getEmail()) === $email) {
                return true;
            }
        }

        return false;
    }
}
