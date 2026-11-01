<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\BoardCalculator;
use App\Calculator\Recurrence\IntervalRecurrence;
use App\Calculator\Recurrence\OneOffRecurrence;
use App\Calculator\RevisionResolver;
use App\Calculator\StrategyRegistry;
use App\Dto\Budget\CreateItemDto;
use App\Dto\Budget\ReviseItemDto;
use App\Entity\Board;
use App\Entity\BudgetItem;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use App\Entity\Tag;
use App\Enum\Budget\ItemKindEnum;
use App\Repository\BoardRepository;
use App\Repository\BudgetItemRepository;
use App\Repository\BudgetItemRevisionRepository;
use App\Repository\TagRepository;
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

/**
 * Postes d'un board. Modifier un montant ou une fréquence ne met jamais une ligne à jour :
 * une révision est créée à partir du mois choisi (seule celle du même mois est remplacée).
 */
final class ItemService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly BudgetItemRepository $itemRepository,
        private readonly BudgetItemRevisionRepository $revisionRepository,
        private readonly TagRepository $tagRepository,
        private readonly StrategyRegistry $registry,
        private readonly RevisionResolver $revisionResolver,
        private readonly SplitRuleWriter $splitRuleWriter,
        private readonly BoardCalculator $calculator,
    ) {}

    /**
     * POST /api/boards/{id}/items
     */
    public function createItem(Request $request, string $boardId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $dto = $this->deserializeDto($request->getContent(), CreateItemDto::class);
        if (!$dto instanceof CreateItemDto) {
            return $dto;
        }

        $kind = ItemKindEnum::from($dto->kind);
        if (!$this->registry->boardType($board->getType())->allowsItemKind($kind)) {
            return $this->sendViolations(['kind' => sprintf('Un poste de type « %s » n\'est pas autorisé sur ce board.', $kind->label())]);
        }

        $from = $dto->effectiveFrom !== null ? Period::fromString($dto->effectiveFrom) : Period::current();
        $errors = $this->validateRule($board, $from, $dto->recurrenceType, $dto->recurrenceParams, $dto->allocation, $dto->endPeriod, $dto->paidByMemberId);
        $errors += $dto->splitStrategy !== null ? $this->splitRuleWriter->validate($board, $dto->splitStrategy, $dto->splitEntries, 'splitEntries') : [];
        if ($errors !== []) {
            return $this->sendViolations($errors);
        }

        $tags = $this->findTags($dto->tagIds, $board);
        if ($tags === null) {
            return $this->sendViolations(['tagIds' => 'Un des tags est introuvable ou n\'est pas utilisable sur ce board.']);
        }

        try {
            $item = (new BudgetItem())
                ->setBoard($board)
                ->setKind($kind)
                ->setLabel(trim($dto->label))
                ->setPosition($dto->position ?? $this->itemRepository->nextPosition($board))
                ->setCreatedBy($this->getAuthenticatedUser())
                ->syncTags($tags);

            $revision = $this->buildRevision(
                $item, $board, $from, (int) $dto->amountCents, $dto->recurrenceType, $dto->recurrenceParams,
                $dto->allocation, $dto->endPeriod, $dto->dueDay, $dto->paidByMemberId, null
            );

            $this->itemRepository->save($item, flush: false, isCreation: true);
            $this->revisionRepository->replace(null, $revision);

            if ($dto->splitStrategy !== null) {
                $this->splitRuleWriter->write($board, $item, $from, $dto->splitStrategy, $dto->splitEntries, $this->getAuthenticatedUser());
            }

            $this->publish('budget_item', $item->getId(), 'budget_item.created', [
                'boardId'  => (string) $board->getId(),
                'kind'     => $kind->value,
                'label'    => $item->getLabel(),
                'revision' => $revision->toSnapshot(),
            ]);

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $this->displayedPeriod($request, $from))), Response::HTTP_CREATED);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la création du poste.', 'budget_item.create.error', $e, ['board_id' => $boardId]);
        }
    }

    /**
     * PUT /api/boards/{id}/items/{itemId} : nouvelle révision à partir de effectiveFrom.
     */
    public function reviseItem(Request $request, string $boardId, string $itemId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $item = $this->itemRepository->findOneInBoard($board, $itemId);
        if (!$item) {
            return $this->notFoundResponse('Poste introuvable.');
        }

        $dto = $this->deserializeDto($request->getContent(), ReviseItemDto::class);
        if (!$dto instanceof ReviseItemDto) {
            return $dto;
        }

        $from = Period::fromString($dto->effectiveFrom);
        $errors = $this->validateRule($board, $from, $dto->recurrenceType, $dto->recurrenceParams, $dto->allocation, $dto->endPeriod, $dto->paidByMemberId);
        $errors += $dto->splitStrategy !== null ? $this->splitRuleWriter->validate($board, $dto->splitStrategy, $dto->splitEntries, 'splitEntries') : [];
        if ($errors !== []) {
            return $this->sendViolations($errors);
        }

        $tags = $dto->tagIds !== null ? $this->findTags($dto->tagIds, $board) : $item->getTags();
        if ($tags === null) {
            return $this->sendViolations(['tagIds' => 'Un des tags est introuvable ou n\'est pas utilisable sur ce board.']);
        }

        try {
            $current = $this->revisionResolver->resolve($item, $from);
            $previousSameMonth = $this->revisionRepository->findOneByItemAndPeriod($item, $from);

            $item->setLabel(trim($dto->label))->syncTags($tags);
            if ($dto->position !== null) {
                $item->setPosition($dto->position);
            }

            $revision = $this->buildRevision(
                $item, $board, $from, (int) $dto->amountCents, $dto->recurrenceType, $dto->recurrenceParams,
                $dto->allocation, $dto->endPeriod, $dto->dueDay, $dto->paidByMemberId, $current
            );

            $this->itemRepository->save($item, flush: false);
            $this->revisionRepository->replace($previousSameMonth, $revision);

            if ($dto->splitStrategy !== null) {
                $this->splitRuleWriter->write($board, $item, $from, $dto->splitStrategy, $dto->splitEntries, $this->getAuthenticatedUser());
            }

            $this->publish('budget_item', $item->getId(), 'budget_item.revised', [
                'boardId' => (string) $board->getId(),
                'label'   => $item->getLabel(),
                'before'  => $current?->toSnapshot(),
                'after'   => $revision->toSnapshot(),
            ]);

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $this->displayedPeriod($request, $from))));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la modification du poste.', 'budget_item.revise.error', $e, ['item_id' => $itemId]);
        }
    }

    /**
     * PATCH /api/boards/{id}/items/{itemId}/toggle : simulation, le poste compte pour 0 sur tous les mois.
     */
    public function toggleItem(Request $request, string $boardId, string $itemId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $item = $this->itemRepository->findOneInBoard($board, $itemId);
        if (!$item) {
            return $this->notFoundResponse('Poste introuvable.');
        }

        $period = $this->resolvePeriod($request->query->get('month'));
        if ($period === null) {
            return $this->invalidPeriodResponse();
        }

        try {
            $this->itemRepository->save($item->toggle());
            $this->publish('budget_item', $item->getId(), 'budget_item.toggled', [
                'boardId'  => (string) $board->getId(),
                'isActive' => $item->isActive(),
            ]);

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $period)));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'activation du poste.', 'budget_item.toggle.error', $e, ['item_id' => $itemId]);
        }
    }

    /**
     * DELETE /api/boards/{id}/items/{itemId} : archivage, l'historique reste intact.
     */
    public function deleteItem(string $boardId, string $itemId): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $item = $this->itemRepository->findOneInBoard($board, $itemId);
        if (!$item) {
            return $this->notFoundResponse('Poste introuvable.');
        }

        try {
            $this->itemRepository->save($item->archive($this->now()));
            $this->publish('budget_item', $item->getId(), 'budget_item.archived', [
                'boardId' => (string) $board->getId(),
                'label'   => $item->getLabel(),
            ]);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la suppression du poste.', 'budget_item.delete.error', $e, ['item_id' => $itemId]);
        }
    }

    /**
     * Mois du board renvoyé après l'écriture : ?month=AAAA-MM (le mois affiché à l'écran), sinon effectiveFrom.
     */
    private function displayedPeriod(Request $request, Period $from): Period
    {
        $month = $request->query->get('month');

        return Period::isValid($month) ? Period::fromString($month) : $from;
    }

    /**
     * Codes connus, paramètres JSON validés par leur stratégie, payeur membre du board.
     *
     * @param array<string, mixed> $recurrenceParams
     *
     * @return array<string, string>
     */
    private function validateRule(
        Board $board,
        Period $from,
        string $recurrenceType,
        array $recurrenceParams,
        string $allocation,
        ?string $endPeriod,
        ?string $paidByMemberId,
    ): array {
        $recurrences = $this->registry->codes('recurrence');
        if (!in_array($recurrenceType, $recurrences, true)) {
            return ['recurrenceType' => sprintf('Récurrence inconnue (%s).', implode(', ', $recurrences))];
        }

        $errors = $this->registry->recurrence($recurrenceType)->validateParams($recurrenceParams);
        if ($errors !== []) {
            return $errors;
        }

        $allocations = $this->registry->codes('allocation');
        if (!in_array($allocation, $allocations, true)) {
            return ['allocation' => sprintf('Mode de prise en compte inconnu (%s).', implode(', ', $allocations))];
        }

        if ($endPeriod !== null && Period::fromString($endPeriod)->isBefore($from)) {
            return ['endPeriod' => 'Le mois de fin ne peut pas précéder le mois de début.'];
        }

        if ($paidByMemberId !== null) {
            $payer = $board->findMember($paidByMemberId);
            if ($payer === null || $payer->isLeft()) {
                return ['paidByMemberId' => 'Le payeur doit être un membre du board.'];
            }
        }

        return [];
    }

    /**
     * @param array<string, mixed> $recurrenceParams
     */
    private function buildRevision(
        BudgetItem $item,
        Board $board,
        Period $from,
        int $amountCents,
        string $recurrenceType,
        array $recurrenceParams,
        string $allocation,
        ?string $endPeriod,
        ?int $dueDay,
        ?string $paidByMemberId,
        ?BudgetItemRevision $current,
    ): BudgetItemRevision {
        // L'ancre d'un intervalle ne doit pas glisser quand le montant change en cours d'année
        if ($recurrenceType === IntervalRecurrence::CODE && !isset($recurrenceParams['anchor'])) {
            $recurrenceParams['anchor'] = $current?->getRecurrenceType() === IntervalRecurrence::CODE
                ? (string) $current->getRecurrenceParam('anchor', $current->getEffectiveFrom()->toString())
                : $from->toString();
        }

        return new BudgetItemRevision(
            item: $item,
            effectiveFrom: $from,
            amount: Money::of($amountCents, $board->getCurrency()),
            recurrenceType: $recurrenceType,
            recurrenceParams: $recurrenceParams,
            allocation: $allocation,
            // Un ponctuel = startMonth égal à endMonth
            endPeriod: $recurrenceType === OneOffRecurrence::CODE ? $from : ($endPeriod !== null ? Period::fromString($endPeriod) : null),
            dueDay: $dueDay,
            paidBy: $paidByMemberId !== null ? $board->findMember($paidByMemberId) : null,
            createdBy: $this->getAuthenticatedUser(),
        );
    }

    /**
     * @param list<string> $tagIds
     *
     * @return list<Tag>|null null si un tag est introuvable ou inutilisable
     */
    private function findTags(array $tagIds, Board $board): ?array
    {
        $tagIds = array_values(array_unique($tagIds));
        $user = $this->getAuthenticatedUser();
        if ($tagIds === [] || $user === null) {
            return [];
        }

        $tags = $this->tagRepository->findUsable($tagIds, $user, $board);

        return count($tags) === count($tagIds) ? $tags : null;
    }
}
