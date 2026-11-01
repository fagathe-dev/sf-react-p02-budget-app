<?php

declare(strict_types=1);

namespace App\Service\ExpenseSplitter;

use App\Calculator\StrategyRegistry;
use App\Dto\ExpenseSplitter\AddExpenseDto;
use App\Entity\Board;
use App\Entity\Embeddable\Money;
use App\Entity\Expense;
use App\Entity\Tag;
use App\Enum\Budget\BoardTypeEnum;
use App\Repository\BoardRepository;
use App\Repository\ExpenseRepository;
use App\Repository\TagRepository;
use App\Security\Voter\BoardVoter;
use App\Service\Budget\BudgetServiceTrait;
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
 * Dépenses réelles d'un groupe. La répartition est calculée par la même SplitStrategy que les boards,
 * puis figée dans ExpenseShare. Corriger = nouvelle dépense qui remplace l'ancienne (annulée).
 */
final class ExpenseService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    private const TYPE = BoardTypeEnum::ExpenseGroup->value;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly ExpenseRepository $expenseRepository,
        private readonly TagRepository $tagRepository,
        private readonly StrategyRegistry $registry,
        private readonly BalanceService $balanceService,
    ) {}

    /**
     * GET /api/expense-groups/{id}/expenses?from=&to=&tagId=&paidBy=
     */
    public function listExpenses(Request $request, string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::VIEW, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        $from = $this->parseDate($request->query->get('from'));
        $to = $this->parseDate($request->query->get('to'));
        if ($from === false || $to === false) {
            return $this->sendViolations(['from' => 'Les dates doivent être au format AAAA-MM-JJ.']);
        }

        $tagId = $request->query->get('tagId');
        $paidBy = $request->query->get('paidBy');

        try {
            $expenses = $this->expenseRepository->findForGroup(
                $group,
                $from,
                $to,
                $tagId !== null && $tagId !== '' ? $tagId : null,
                $paidBy !== null && $paidBy !== '' ? $paidBy : null,
            );

            return $this->sendJson(['expenses' => $expenses], context: ['groups' => ['expense.read']]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du chargement des dépenses.', 'expense.list.error', $e, ['group_id' => $groupId]);
        }
    }

    /**
     * POST /api/expense-groups/{id}/expenses
     */
    public function addExpense(Request $request, string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::EDIT, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        $dto = $this->deserializeDto($request->getContent(), AddExpenseDto::class);
        if (!$dto instanceof AddExpenseDto) {
            return $dto;
        }

        $expense = $this->buildExpense($group, $dto, null);
        if (!$expense instanceof Expense) {
            return $expense;
        }

        try {
            $this->expenseRepository->save($expense);
            $this->publish('expense', $expense->getId(), 'expense.added', [
                'groupId'     => (string) $group->getId(),
                'label'       => $expense->getLabel(),
                'amountCents' => $expense->getAmount()->getAmountCents(),
            ]);

            return $this->sendJson(
                ['expense' => $expense, ...$this->balanceService->compute($group)],
                Response::HTTP_CREATED,
                context: ['groups' => ['expense.read']]
            );
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'ajout de la dépense.', 'expense.add.error', $e, ['group_id' => $groupId]);
        }
    }

    /**
     * PUT /api/expense-groups/{id}/expenses/{expenseId} : la correction remplace l'ancienne dépense.
     */
    public function correctExpense(Request $request, string $groupId, string $expenseId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::EDIT, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        $previous = $this->expenseRepository->findOneInGroup($group, $expenseId);
        if (!$previous || $previous->isVoided()) {
            return $this->notFoundResponse('Dépense introuvable ou déjà annulée.');
        }

        $dto = $this->deserializeDto($request->getContent(), AddExpenseDto::class);
        if (!$dto instanceof AddExpenseDto) {
            return $dto;
        }

        $replacement = $this->buildExpense($group, $dto, $previous);
        if (!$replacement instanceof Expense) {
            return $replacement;
        }

        try {
            $this->expenseRepository->supersede($previous, $replacement, $this->now());
            $this->publish('expense', $replacement->getId(), 'expense.corrected', [
                'groupId'      => (string) $group->getId(),
                'supersedesId' => (string) $previous->getId(),
                'before'       => ['label' => $previous->getLabel(), 'amountCents' => $previous->getAmount()->getAmountCents()],
                'after'        => ['label' => $replacement->getLabel(), 'amountCents' => $replacement->getAmount()->getAmountCents()],
            ]);

            return $this->sendJson(
                ['expense' => $replacement, ...$this->balanceService->compute($group)],
                context: ['groups' => ['expense.read']]
            );
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la correction de la dépense.', 'expense.correct.error', $e, ['expense_id' => $expenseId]);
        }
    }

    /**
     * DELETE /api/expense-groups/{id}/expenses/{expenseId} : annulation (voidedAt), rien n'est supprimé.
     */
    public function voidExpense(string $groupId, string $expenseId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::EDIT, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        $expense = $this->expenseRepository->findOneInGroup($group, $expenseId);
        if (!$expense || $expense->isVoided()) {
            return $this->notFoundResponse('Dépense introuvable ou déjà annulée.');
        }

        try {
            $this->expenseRepository->save($expense->void($this->now()));
            $this->publish('expense', $expense->getId(), 'expense.voided', [
                'groupId'     => (string) $group->getId(),
                'label'       => $expense->getLabel(),
                'amountCents' => $expense->getAmount()->getAmountCents(),
            ]);

            return $this->sendJson($this->balanceService->compute($group));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'annulation de la dépense.', 'expense.void.error', $e, ['expense_id' => $expenseId]);
        }
    }

    /**
     * Valide la saisie et construit la dépense avec ses parts ; ou la réponse d'erreur.
     *
     * @return Expense|object
     */
    private function buildExpense(Board $group, AddExpenseDto $dto, ?Expense $supersedes): object
    {
        $payer = $group->findMember($dto->paidByMemberId);
        if ($payer === null || $payer->isLeft()) {
            return $this->sendViolations(['paidByMemberId' => 'Le payeur doit être un participant du groupe.']);
        }

        if (!in_array($dto->splitStrategy, $this->registry->codes('split'), true)) {
            return $this->sendViolations(['splitStrategy' => sprintf('Mode de répartition inconnu (%s).', implode(', ', $this->registry->codes('split')))]);
        }

        $inputs = [];
        foreach ($dto->participants as $participant) {
            $member = $group->findMember($participant['memberId']);
            if ($member === null || $member->isLeft()) {
                return $this->sendViolations(['participants' => 'Chaque participant doit faire partie du groupe.']);
            }
            $inputs[(string) $member->getId()] = $participant['value'] ?? null;
        }

        // L'ordre de création des membres départage les centimes d'arrondi
        $values = [];
        foreach ($group->getSplittableMembers() as $member) {
            if (array_key_exists((string) $member->getId(), $inputs)) {
                $values[(string) $member->getId()] = $inputs[(string) $member->getId()];
            }
        }

        $amount = Money::of((int) $dto->amountCents, $group->getCurrency());
        $strategy = $this->registry->split($dto->splitStrategy);
        $errors = $strategy->validate($amount, $values);
        if ($errors !== []) {
            return $this->sendViolations(['participants' => (string) reset($errors)]);
        }

        $tag = null;
        if ($dto->tagId !== null) {
            $tag = $this->tagRepository->find($dto->tagId);
            if (!$tag instanceof Tag || !$this->isTagUsable($tag, $group)) {
                return $this->sendViolations(['tagId' => 'Ce tag est introuvable ou n\'est pas utilisable dans ce groupe.']);
            }
        }

        $expense = new Expense(
            board: $group,
            paidBy: $payer,
            label: trim($dto->label),
            amount: $amount,
            spentOn: \DateTimeImmutable::createFromFormat('!Y-m-d', $dto->spentOn),
            splitStrategy: $dto->splitStrategy,
            tag: $tag,
            supersedes: $supersedes,
            createdBy: $this->getAuthenticatedUser(),
        );

        foreach ($strategy->split($amount, $values) as $memberId => $shareCents) {
            if ($shareCents > 0) {
                $expense->addShare($group->findMember((string) $memberId), $shareCents, $values[$memberId] ?? null);
            }
        }

        return $expense;
    }

    private function isTagUsable(Tag $tag, Board $group): bool
    {
        if ($tag->getOwnerBoard() !== null) {
            return (string) $tag->getOwnerBoard()->getId() === (string) $group->getId();
        }

        return (string) $tag->getOwner()?->getId() === (string) $this->getAuthenticatedUser()?->getId();
    }

    /**
     * @return \DateTimeImmutable|null|false false si la date est invalide
     */
    private function parseDate(?string $value): \DateTimeImmutable|null|false
    {
        if ($value === null || $value === '') {
            return null;
        }

        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return $date !== false && $date->format('Y-m-d') === $value ? $date : false;
    }
}
