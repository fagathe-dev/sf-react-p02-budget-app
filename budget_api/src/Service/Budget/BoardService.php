<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\BoardCalculator;
use App\Dto\Budget\CreateBoardDto;
use App\Dto\Budget\SplitRuleDto;
use App\Dto\Budget\UpdateBoardDto;
use App\Entity\Board;
use App\Enum\Budget\BoardTypeEnum;
use App\Repository\BoardRepository;
use App\Security\Voter\BoardVoter;
use App\ValueObject\Period;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Throwable;

final class BoardService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly BoardFactory $boardFactory,
        private readonly BoardCalculator $calculator,
        private readonly SplitRuleWriter $splitRuleWriter,
    ) {}

    /**
     * GET /api/boards : mon board perso puis mes boards partagés, avec leurs totaux du mois.
     */
    public function listBoards(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        $period = $this->resolvePeriod($request->query->get('month'));
        if ($period === null) {
            return $this->invalidPeriodResponse();
        }

        try {
            // Comptes activés avant l'existence du budget : le board perso est créé à la première lecture
            if ($this->boardRepository->findPersonalBoard($user) === null) {
                $this->boardFactory->createPersonal($user);
            }

            $boards = $this->boardRepository->findForUser($user, [BoardTypeEnum::Personal->value, BoardTypeEnum::Shared->value]);
            usort($boards, static fn (Board $a, Board $b): int => (int) $b->isPersonal() <=> (int) $a->isPersonal());

            return $this->sendJson([
                'period' => $period->toString(),
                'boards' => array_map(fn (Board $board): array => $this->summarize($board, $period), $boards),
            ]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du chargement des boards.', 'board.list.error', $e);
        }
    }

    /**
     * POST /api/boards : board perso (un seul par utilisateur) ou board partagé.
     */
    public function createBoard(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        $dto = $this->deserializeDto($request->getContent(), CreateBoardDto::class);
        if (!$dto instanceof CreateBoardDto) {
            return $dto;
        }

        if ($dto->type === BoardTypeEnum::Personal->value && $this->boardRepository->findPersonalBoard($user) !== null) {
            return $this->sendJson(['message' => 'Vous avez déjà un board perso.'], Response::HTTP_CONFLICT);
        }

        try {
            $board = $this->boardFactory->create($user, $dto->type, $dto->name, $dto->currency, $dto->settings, $dto->guests);
            $period = Period::current();

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $period)), Response::HTTP_CREATED);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la création du board.', 'board.create.error', $e);
        }
    }

    /**
     * GET /api/boards/{id}?month=AAAA-MM : board calculé, prêt à afficher.
     */
    public function getBoard(Request $request, string $boardId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::VIEW);
        if (!$board instanceof Board) {
            return $board;
        }

        $period = $this->resolvePeriod($request->query->get('month'));
        if ($period === null) {
            return $this->invalidPeriodResponse();
        }

        try {
            return $this->sendJson($this->presentBoard($board, $this->calculator->calculate($board, $period)));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du calcul du board.', 'board.get.error', $e, ['board_id' => $boardId]);
        }
    }

    /**
     * PUT /api/boards/{id} : renommer, modifier les réglages (fusionnés avec les existants).
     */
    public function updateBoard(Request $request, string $boardId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $dto = $this->deserializeDto($request->getContent(), UpdateBoardDto::class);
        if (!$dto instanceof UpdateBoardDto) {
            return $dto;
        }

        $before = ['name' => $board->getName(), 'settings' => $board->getSettings()];
        $board->setName(trim($dto->name));
        if ($dto->settings !== null) {
            $board->setSettings(array_merge($board->getSettings(), $dto->settings));
        }

        try {
            $this->boardRepository->save($board);
            $this->publish('board', $board->getId(), 'board.updated', [
                'before' => $before,
                'after'  => ['name' => $board->getName(), 'settings' => $board->getSettings()],
            ]);

            return $this->sendJson($board, context: ['groups' => ['board.read']]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la mise à jour du board.', 'board.update.error', $e, ['board_id' => $boardId]);
        }
    }

    /**
     * DELETE /api/boards/{id} : archivage (les révisions et le journal gardent leurs références).
     */
    public function deleteBoard(string $boardId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::MANAGE_MEMBERS);
        if (!$board instanceof Board) {
            return $board;
        }

        if ($board->isPersonal()) {
            return $this->sendJson(['message' => 'Le board perso ne peut pas être supprimé.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $board->archive($this->now());
            $this->boardRepository->save($board);
            $this->publish('board', $board->getId(), 'board.archived', ['name' => $board->getName()]);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la suppression du board.', 'board.delete.error', $e, ['board_id' => $boardId]);
        }
    }

    /**
     * PUT /api/boards/{id}/split-rule : répartition par défaut du board, à partir d'un mois.
     */
    public function setSplitRule(Request $request, string $boardId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $dto = $this->deserializeDto($request->getContent(), SplitRuleDto::class);
        if (!$dto instanceof SplitRuleDto) {
            return $dto;
        }

        $errors = $this->splitRuleWriter->validate($board, $dto->strategy, $dto->entries);
        if ($errors !== []) {
            return $this->sendViolations($errors);
        }

        $period = $dto->effectiveFrom !== null ? Period::fromString($dto->effectiveFrom) : Period::current();

        try {
            $this->splitRuleWriter->write($board, null, $period, $dto->strategy, $dto->entries, $this->getAuthenticatedUser());
            $this->publish('board', $board->getId(), 'board.split_rule_changed', [
                'effectiveFrom' => $period->toString(),
                'strategy'      => $dto->strategy,
                'entries'       => $dto->entries,
            ]);

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $period)));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la modification de la répartition.', 'board.split_rule.error', $e, ['board_id' => $boardId]);
        }
    }

    /**
     * Résumé d'un board pour la sidebar et la liste : totaux, ma part, équilibre.
     *
     * @return array<string, mixed>
     */
    private function summarize(Board $board, Period $period): array
    {
        $result = $this->calculator->calculate($board, $period);
        $user = $this->getAuthenticatedUser();
        $myMember = $user !== null ? $board->findMemberForUser($user) : null;
        $myMemberId = $myMember?->getId()?->toRfc4122();

        return [
            'id'           => $result->boardId,
            'type'         => $result->type,
            'name'         => $result->name,
            'currency'     => $result->currency,
            'role'         => $myMember?->getRole()->value,
            'memberCount'  => count($result->members),
            'totals'       => $result->totals,
            'myShareCents' => $myMemberId !== null ? ($result->memberShares[$myMemberId] ?? 0) : null,
            'balance'      => $result->balance === null ? null : [
                'contributionCents' => $myMemberId !== null ? ($result->balance['contributions'][$myMemberId] ?? 0) : null,
                'balanceCents'      => $myMemberId !== null ? ($result->balance['balances'][$myMemberId] ?? 0) : null,
                'summary'           => $result->balance['summary'],
            ],
        ];
    }
}
