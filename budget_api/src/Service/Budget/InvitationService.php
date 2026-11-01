<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\StrategyRegistry;
use App\Dto\Budget\InviteMemberDto;
use App\Entity\Board;
use App\Entity\BoardMember;
use App\Entity\Invitation;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\InvitationChannelEnum;
use App\Enum\Budget\InvitationStatusEnum;
use App\Enum\Budget\MemberRoleEnum;
use App\Repository\BoardMemberRepository;
use App\Repository\BoardRepository;
use App\Repository\InvitationRepository;
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
 * Invitations communes aux boards partagés et aux groupes de dépenses. Ce qui se passe à l'acceptation
 * dépend du type de board (BoardTypeHandler::onMemberJoined).
 */
final class InvitationService
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
        private readonly InvitationIssuer $invitationIssuer,
        private readonly StrategyRegistry $registry,
    ) {}

    /**
     * POST /api/boards/{id}/invitations : par e-mail ou lien partageable, pour un invité local existant ou un nouveau membre.
     */
    public function invite(Request $request, string $boardId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::MANAGE_MEMBERS);
        if (!$board instanceof Board) {
            return $board;
        }

        if (!$this->registry->boardType($board->getType())->acceptsMembers()) {
            return $this->sendJson(['message' => 'Ce board n\'accepte pas d\'invitation.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $dto = $this->deserializeDto($request->getContent(), InviteMemberDto::class);
        if (!$dto instanceof InviteMemberDto) {
            return $dto;
        }

        $channel = InvitationChannelEnum::from($dto->channel);
        $email = $dto->email !== null && trim($dto->email) !== '' ? strtolower(trim($dto->email)) : null;
        if ($channel === InvitationChannelEnum::Email && $email === null) {
            return $this->sendViolations(['email' => 'L\'adresse e-mail est obligatoire pour une invitation par e-mail.']);
        }

        $member = $this->resolveInvitedMember($board, $dto, $email);
        if (!$member instanceof BoardMember) {
            return $member;
        }

        try {
            $this->memberRepository->save($member, flush: false);
            $issued = $this->invitationIssuer->issue($board, $member, $this->getAuthenticatedUser(), $channel, $email, $dto->maxUses, $dto->ttlDays);

            $this->publish('board', $board->getId(), 'board.member_invited', [
                'memberId'     => (string) $member->getId(),
                'invitationId' => (string) $issued['invitation']->getId(),
                'channel'      => $channel->value,
                'email'        => $email,
            ]);

            return $this->sendJson(
                [
                    'invitation' => $issued['invitation'],
                    'member'     => $member,
                    // Le jeton en clair n'est jamais stocké : le lien n'est renvoyé qu'une fois, pour le canal « link »
                    'url'        => $channel === InvitationChannelEnum::Link ? $issued['url'] : null,
                ],
                Response::HTTP_CREATED,
                context: ['groups' => ['invitation.read', 'member.read']]
            );
        } catch (RecipientUnreachableException) {
            return $this->sendJson(['message' => 'Le domaine de cette adresse e-mail ne semble pas pouvoir recevoir d\'e-mails.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (MailerExceptionInterface) {
            return $this->sendJson(['message' => 'Impossible d\'envoyer l\'invitation pour le moment.'], Response::HTTP_BAD_GATEWAY);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'envoi de l\'invitation.', 'board.invitation.create.error', $e, ['board_id' => $boardId]);
        }
    }

    /**
     * GET /api/invitations/{token} (public) : aperçu avant acceptation.
     */
    public function preview(string $token): object
    {
        $invitation = $this->invitationRepository->findOneByTokenHash(Invitation::hashToken($token));
        if (!$invitation) {
            return $this->notFoundResponse('Invitation introuvable.');
        }

        $this->expireIfNeeded($invitation);
        $board = $invitation->getBoard();

        return $this->sendJson([
            'boardName'      => $board->getName(),
            'boardType'      => $board->getType(),
            'boardTypeLabel' => BoardTypeEnum::labelOf($board->getType()),
            'invitedBy'      => $invitation->getInvitedBy() !== null ? BoardFactory::displayNameOf($invitation->getInvitedBy()) : null,
            'memberName'     => $invitation->getMember()->getDisplayName(),
            'expiresAt'      => $invitation->getExpiresAt(),
            'status'         => $invitation->getStatus()->value,
            'isUsable'       => $invitation->isUsable($this->now()) && !$board->isArchived(),
        ]);
    }

    /**
     * POST /api/invitations/{token}/accept : le compte est rattaché au membre, et sa part remonte dans son board perso.
     */
    public function accept(string $token): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        $invitation = $this->invitationRepository->findOneByTokenHash(Invitation::hashToken($token));
        if (!$invitation) {
            return $this->notFoundResponse('Invitation introuvable.');
        }

        $this->expireIfNeeded($invitation);
        $board = $invitation->getBoard();
        $now = $this->now();

        if (!$invitation->isUsable($now) || $board->isArchived() || $invitation->getMember()->isLeft()) {
            return $this->sendJson(['message' => 'Cette invitation a expiré, a été révoquée ou a déjà été utilisée.'], Response::HTTP_GONE);
        }

        $existing = $board->findMemberForUser($user);
        if ($existing !== null && !$existing->isLeft()) {
            return $this->sendJson(['message' => 'Vous faites déjà partie de ce board.'], Response::HTTP_CONFLICT);
        }

        try {
            // Lien à usages multiples déjà utilisé : chaque nouvel arrivant reçoit son propre membre
            $member = $invitation->getMember();
            if ($member->isLinked()) {
                $member = (new BoardMember())
                    ->setBoard($board)
                    ->setDisplayName(BoardFactory::displayNameOf($user))
                    ->setRole(MemberRoleEnum::Editor);
            }

            $member->attachUser($user)->activate($now);
            $invitation->accept($user, $now);

            $this->memberRepository->save($member, flush: false);
            $this->invitationRepository->save($invitation);

            $this->registry->boardType($board->getType())->onMemberJoined($member, Period::current());

            $this->publish('board', $board->getId(), 'board.member_joined', [
                'memberId'     => (string) $member->getId(),
                'invitationId' => (string) $invitation->getId(),
                'userId'       => (string) $user->getId(),
            ]);

            return $this->sendJson([
                'message'   => sprintf('Vous avez rejoint « %s ».', $board->getName()),
                'boardId'   => (string) $board->getId(),
                'boardType' => $board->getType(),
                'memberId'  => (string) $member->getId(),
            ]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'acceptation de l\'invitation.', 'board.invitation.accept.error', $e);
        }
    }

    /**
     * DELETE /api/boards/{id}/invitations/{invitationId} : révoquer une invitation en attente.
     */
    public function revoke(string $boardId, string $invitationId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::MANAGE_MEMBERS);
        if (!$board instanceof Board) {
            return $board;
        }

        $invitation = $this->invitationRepository->findOneInBoard($board, $invitationId);
        if (!$invitation) {
            return $this->notFoundResponse('Invitation introuvable.');
        }

        if (!$invitation->isUsable($this->now())) {
            return $this->sendJson(['message' => 'Seule une invitation en attente peut être révoquée.'], Response::HTTP_CONFLICT);
        }

        try {
            $this->invitationRepository->save($invitation->revoke());
            $this->publish('board', $board->getId(), 'board.invitation_revoked', ['invitationId' => (string) $invitation->getId()]);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la révocation de l\'invitation.', 'board.invitation.revoke.error', $e, ['invitation_id' => $invitationId]);
        }
    }

    /**
     * Invité local existant (memberId), sinon nouveau membre « invited » ; ou la réponse d'erreur.
     *
     * @return BoardMember|object
     */
    private function resolveInvitedMember(Board $board, InviteMemberDto $dto, ?string $email): object
    {
        if ($email !== null) {
            foreach ($board->getSplittableMembers() as $member) {
                if (strtolower((string) $member->getUser()?->getEmail()) === $email) {
                    return $this->sendJson(['message' => 'Cette personne fait déjà partie du board.'], Response::HTTP_CONFLICT);
                }
            }
        }

        if ($dto->memberId !== null) {
            $member = $board->findMember($dto->memberId);
            if (!$member || $member->isLeft()) {
                return $this->notFoundResponse('Membre introuvable.');
            }

            if ($member->isLinked()) {
                return $this->sendJson(['message' => 'Ce membre est déjà lié à un compte.'], Response::HTTP_CONFLICT);
            }

            return $member;
        }

        $displayName = trim((string) $dto->displayName);
        if ($displayName === '' && $email !== null) {
            $displayName = ucfirst(strstr($email, '@', true) ?: $email);
        }

        if ($displayName === '') {
            return $this->sendViolations(['displayName' => 'Le prénom du membre invité est obligatoire.']);
        }

        return (new BoardMember())
            ->setBoard($board)
            ->setDisplayName(mb_substr($displayName, 0, 80))
            ->setRole(MemberRoleEnum::Editor)
            ->markInvited();
    }

    private function expireIfNeeded(Invitation $invitation): void
    {
        if ($invitation->getStatus() === InvitationStatusEnum::Pending && $invitation->isExpired($this->now())) {
            $this->invitationRepository->save($invitation->markExpired());
        }
    }
}
