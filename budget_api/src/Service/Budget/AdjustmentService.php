<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\BoardCalculator;
use App\Calculator\RevisionResolver;
use App\Calculator\StrategyRegistry;
use App\Dto\Budget\SetAdjustmentDto;
use App\Entity\Board;
use App\Entity\BudgetItemAdjustment;
use App\Repository\BoardRepository;
use App\Repository\BudgetItemAdjustmentRepository;
use App\Repository\BudgetItemRepository;
use App\Security\Voter\BoardVoter;
use App\ValueObject\Period;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Throwable;

/**
 * Menu « Ce mois-ci » d'une ligne : Compter, Ne pas compter, Montant réel…, Revenir à la règle.
 */
final class AdjustmentService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly BudgetItemRepository $itemRepository,
        private readonly BudgetItemAdjustmentRepository $adjustmentRepository,
        private readonly StrategyRegistry $registry,
        private readonly RevisionResolver $revisionResolver,
        private readonly BoardCalculator $calculator,
    ) {}

    /**
     * PUT /api/boards/{id}/items/{itemId}/months/{month}
     */
    public function setAdjustment(Request $request, string $boardId, string $itemId, string $month): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $item = $this->itemRepository->findOneInBoard($board, $itemId);
        if (!$item) {
            return $this->notFoundResponse('Poste introuvable.');
        }

        $period = Period::fromString($month);
        if ($this->revisionResolver->resolve($item, $period) === null) {
            return $this->sendViolations(['month' => 'Aucune règle n\'est en vigueur pour ce poste ce mois-ci.']);
        }

        $dto = $this->deserializeDto($request->getContent(), SetAdjustmentDto::class);
        if (!$dto instanceof SetAdjustmentDto) {
            return $dto;
        }

        $types = $this->registry->codes('adjustment');
        if (!in_array($dto->type, $types, true)) {
            return $this->sendViolations(['type' => sprintf('Type d\'exception inconnu (%s).', implode(', ', $types))]);
        }

        $errors = $this->registry->adjustment($dto->type)->validate($dto->amountCents, $dto->params);
        if ($errors !== []) {
            return $this->sendViolations($errors);
        }

        try {
            $previous = $this->adjustmentRepository->findOneByItemAndPeriod($item, $period);
            $adjustment = new BudgetItemAdjustment(
                item: $item,
                period: $period,
                type: $dto->type,
                amountCents: $dto->amountCents,
                params: $dto->params,
                note: $dto->note !== null && trim($dto->note) !== '' ? trim($dto->note) : null,
                createdBy: $this->getAuthenticatedUser(),
            );

            $this->adjustmentRepository->replace($previous, $adjustment);
            $this->publish('budget_item', $item->getId(), 'budget_item.adjusted', [
                'boardId' => (string) $board->getId(),
                'before'  => $previous?->toSnapshot(),
                'after'   => $adjustment->toSnapshot(),
            ]);

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $period)));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'enregistrement de l\'exception du mois.', 'budget_item.adjust.error', $e, ['item_id' => $itemId]);
        }
    }

    /**
     * DELETE /api/boards/{id}/items/{itemId}/months/{month} : revenir à la règle.
     */
    public function removeAdjustment(string $boardId, string $itemId, string $month): object
    {
        $board = $this->findGrantedBoard($boardId, BoardVoter::EDIT);
        if (!$board instanceof Board) {
            return $board;
        }

        $item = $this->itemRepository->findOneInBoard($board, $itemId);
        if (!$item) {
            return $this->notFoundResponse('Poste introuvable.');
        }

        $period = Period::fromString($month);
        $adjustment = $this->adjustmentRepository->findOneByItemAndPeriod($item, $period);
        if (!$adjustment) {
            return $this->notFoundResponse('Aucune exception pour ce mois.');
        }

        try {
            $snapshot = $adjustment->toSnapshot();
            $this->adjustmentRepository->remove($adjustment);
            $this->publish('budget_item', $item->getId(), 'budget_item.adjustment_removed', [
                'boardId' => (string) $board->getId(),
                'before'  => $snapshot,
            ]);

            return $this->sendJson($this->presentBoard($board, $this->calculator->recalculate($board, $period)));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du retour à la règle.', 'budget_item.adjustment_remove.error', $e, ['item_id' => $itemId]);
        }
    }
}
