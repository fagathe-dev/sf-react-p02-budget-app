<?php

declare(strict_types=1);

namespace App\Calculator;

use App\Calculator\Result\BoardResult;
use App\Calculator\Result\LineResult;
use App\Calculator\Result\RollupResult;
use App\Calculator\Split\EqualsSplit;
use App\Entity\Board;
use App\Entity\BoardMember;
use App\Entity\BudgetItem;
use App\Entity\BudgetItemAdjustment;
use App\Entity\Embeddable\Money;
use App\Entity\SplitRule;
use App\Entity\Tag;
use App\Enum\Budget\ItemKindEnum;
use App\Repository\BoardLinkRepository;
use App\Repository\BudgetItemAdjustmentRepository;
use App\Repository\BudgetItemRepository;
use App\Repository\SplitRuleRepository;
use App\ValueObject\Period;
use Symfony\Contracts\Service\ResetInterface;

/**
 * Calcule un board pour un mois. Chaque étape délègue à la stratégie désignée par un code en base :
 * révision en vigueur -> récurrence -> prise en compte -> exception -> répartition -> remontées.
 * Les résultats sont mémorisés le temps de la requête (un board partagé n'est calculé qu'une fois).
 */
final class BoardCalculator implements ResetInterface
{
    /** @var array<string, BoardResult> */
    private array $memo = [];

    public function __construct(
        private readonly StrategyRegistry $registry,
        private readonly RevisionResolver $revisionResolver,
        private readonly BalanceCalculator $balanceCalculator,
        private readonly BudgetItemRepository $itemRepository,
        private readonly BudgetItemAdjustmentRepository $adjustmentRepository,
        private readonly SplitRuleRepository $splitRuleRepository,
        private readonly BoardLinkRepository $linkRepository,
    ) {}

    public function calculate(Board $board, Period $period): BoardResult
    {
        return $this->memo[sprintf('%s|%s', $board->getId(), $period)] ??= $this->compute($board, $period);
    }

    /**
     * Après une écriture : oublie les résultats mémorisés puis recalcule.
     */
    public function recalculate(Board $board, Period $period): BoardResult
    {
        $this->reset();

        return $this->calculate($board, $period);
    }

    public function reset(): void
    {
        $this->memo = [];
    }

    private function compute(Board $board, Period $period): BoardResult
    {
        $members = $board->getSplittableMembers();
        $memberIds = array_map(static fn (BoardMember $member): string => (string) $member->getId(), $members);

        $adjustments = $this->adjustmentRepository->findIndexedByItem($board, $period);
        [$boardRule, $itemRules] = $this->indexSplitRules($this->splitRuleRepository->findEffectiveForBoard($board, $period));

        $lines = [];
        foreach ($this->itemRepository->findForCalculation($board) as $item) {
            $itemId = (string) $item->getId();
            $lines[] = $this->computeLine(
                $item,
                $period,
                $adjustments[$itemId] ?? null,
                $itemRules[$itemId] ?? $boardRule,
                $memberIds,
                $board->getCurrency()
            );
        }

        $rollups = $board->isPersonal() ? $this->computeRollups($board, $period) : [];

        return new BoardResult(
            boardId: (string) $board->getId(),
            type: $board->getType(),
            name: (string) $board->getName(),
            currency: $board->getCurrency(),
            period: $period->toString(),
            members: array_map($this->describeMember(...), $members),
            lines: $lines,
            rollups: $rollups,
            totals: $this->computeTotals($lines, $rollups),
            memberShares: $this->sumShares($lines, $memberIds),
            balance: count($members) > 1 ? $this->computeBalance($lines, $members, $board->getCurrency()) : null,
        );
    }

    /**
     * Montant d'un poste pour le mois M, dans l'ordre : désactivé -> hors période -> exception -> règle.
     *
     * @param list<string> $memberIds
     */
    private function computeLine(
        BudgetItem $item,
        Period $period,
        ?BudgetItemAdjustment $adjustment,
        ?SplitRule $rule,
        array $memberIds,
        string $currency,
    ): LineResult {
        $revision = $this->revisionResolver->resolve($item, $period);
        $amount = Money::zero($revision?->getAmount()->getCurrency() ?? $currency);
        $isDue = false;
        $isMonthly = true;
        $adjustmentType = null;

        if ($revision !== null) {
            $recurrence = $this->registry->recurrence($revision->getRecurrenceType());
            $cycle = $recurrence->cycle($revision);
            $isMonthly = $cycle->isMonthly();

            if ($item->isActive() && $revision->covers($period)) {
                $isDue = $recurrence->isDue($revision, $period);
                $amount = $this->registry->allocation($revision->getAllocation())->amountFor($revision, $period, $isDue, $cycle);

                if ($adjustment !== null) {
                    $amount = $this->registry->adjustment($adjustment->getType())->apply($adjustment, $amount, $revision, $isDue);
                    $adjustmentType = $adjustment->getType();
                    $isDue = !$amount->isZero();
                }
            }
        }

        return new LineResult(
            itemId: (string) $item->getId(),
            kind: $item->getKind()->value,
            label: (string) $item->getLabel(),
            position: $item->getPosition(),
            isActive: $item->isActive(),
            isDue: $isDue,
            isMonthly: $isMonthly,
            isVariable: $revision?->isVariable() ?? false,
            amountCents: $amount->getAmountCents(),
            ruleAmountCents: $revision?->getAmount()->getAmountCents(),
            recurrenceType: $revision?->getRecurrenceType(),
            allocation: $revision?->getAllocation(),
            dueDay: $revision?->getDueDay(),
            paidByMemberId: $revision?->getPaidBy()?->getId()?->toRfc4122(),
            adjustmentType: $adjustmentType,
            tags: array_map($this->describeTag(...), $item->getTags()),
            shares: $this->split($amount, $rule, $memberIds),
            recurrenceParams: $revision?->getRecurrenceParams() ?? [],
            endPeriod: $revision?->getEndPeriod()?->toString(),
        );
    }

    /**
     * Part de chaque membre : règle du poste si elle existe, sinon celle du board, sinon parts égales.
     *
     * @param list<string> $memberIds
     *
     * @return array<string, int>
     */
    private function split(Money $amount, ?SplitRule $rule, array $memberIds): array
    {
        if ($memberIds === []) {
            return [];
        }

        $ruleValues = $rule?->getValuesByMember() ?? [];
        $values = [];
        foreach ($memberIds as $memberId) {
            if (array_key_exists($memberId, $ruleValues)) {
                $values[$memberId] = $ruleValues[$memberId];
            }
        }

        // Règle sans entrée (parts égales entre tous) ou dont tous les membres sont partis
        if ($values === []) {
            return $this->registry->split(EqualsSplit::CODE)->split($amount, array_fill_keys($memberIds, null));
        }

        return $this->registry->split($rule->getStrategy())->split($amount, $values);
    }

    /**
     * @param list<SplitRule> $rules triées de la plus récente à la plus ancienne
     *
     * @return array{0: SplitRule|null, 1: array<string, SplitRule>}
     */
    private function indexSplitRules(array $rules): array
    {
        $boardRule = null;
        $itemRules = [];

        foreach ($rules as $rule) {
            if ($rule->getItem() === null) {
                $boardRule ??= $rule;
                continue;
            }

            $itemRules[(string) $rule->getItem()->getId()] ??= $rule;
        }

        return [$boardRule, $itemRules];
    }

    /**
     * @return list<RollupResult>
     */
    private function computeRollups(Board $board, Period $period): array
    {
        $rollups = [];

        foreach ($this->linkRepository->findActiveTargeting($board, $period) as $link) {
            $rollup = $this->registry->link((string) $link->getType())->contribute($link, $period, $this);

            if ($rollup !== null) {
                $rollups[] = $rollup;
            }
        }

        return $rollups;
    }

    /**
     * Total charges = dépenses propres + quotes-parts ; reste à vivre = revenus - charges - épargne.
     *
     * @param list<LineResult> $lines
     * @param list<RollupResult> $rollups
     *
     * @return array<string, int|float|null>
     */
    private function computeTotals(array $lines, array $rollups): array
    {
        $byKind = [ItemKindEnum::Income->value => 0, ItemKindEnum::Expense->value => 0, ItemKindEnum::Savings->value => 0];
        foreach ($lines as $line) {
            $byKind[$line->kind] += $line->amountCents;
        }

        $rollupExpense = array_sum(array_map(static fn (RollupResult $rollup): int => $rollup->expenseCents, $rollups));
        $rollupSavings = array_sum(array_map(static fn (RollupResult $rollup): int => $rollup->savingsCents, $rollups));

        $income = $byKind[ItemKindEnum::Income->value];
        $charges = $byKind[ItemKindEnum::Expense->value] + $rollupExpense;
        $savings = $byKind[ItemKindEnum::Savings->value] + $rollupSavings;

        return [
            'incomeCents'        => $income,
            'expenseCents'       => $byKind[ItemKindEnum::Expense->value],
            'ownSavingsCents'    => $byKind[ItemKindEnum::Savings->value],
            'rollupExpenseCents' => $rollupExpense,
            'rollupSavingsCents' => $rollupSavings,
            'chargesCents'       => $charges,
            'savingsCents'       => $savings,
            'remainingCents'     => $income - $charges - $savings,
            'chargesRatio'       => $income > 0 ? round($charges * 100 / $income, 1) : null,
            'householdCents'     => $byKind[ItemKindEnum::Expense->value] + $byKind[ItemKindEnum::Savings->value],
        ];
    }

    /**
     * @param list<LineResult> $lines
     * @param list<string> $memberIds
     *
     * @return array<string, int>
     */
    private function sumShares(array $lines, array $memberIds): array
    {
        $totals = array_fill_keys($memberIds, 0);
        foreach ($lines as $line) {
            foreach ($line->shares as $memberId => $share) {
                $totals[$memberId] = ($totals[$memberId] ?? 0) + $share;
            }
        }

        return $totals;
    }

    /**
     * Versement au compte commun = ma part des postes prélevés sur le compte commun.
     * Solde = ce que mon compte a prélevé - ma part de ces mêmes postes (positif : on me doit).
     *
     * @param list<LineResult> $lines
     * @param list<BoardMember> $members
     *
     * @return array<string, mixed>
     */
    private function computeBalance(array $lines, array $members, string $currency): array
    {
        $names = [];
        foreach ($members as $member) {
            $names[(string) $member->getId()] = (string) $member->getDisplayName();
        }

        $memberIds = array_keys($names);
        $contributions = array_fill_keys($memberIds, 0);
        $paid = array_fill_keys($memberIds, 0);
        $owed = array_fill_keys($memberIds, 0);

        foreach ($lines as $line) {
            if ($line->amountCents === 0) {
                continue;
            }

            // Compte commun, ou payeur parti depuis : la ligne passe par le compte commun
            if ($line->paidByMemberId === null || !isset($paid[$line->paidByMemberId])) {
                foreach ($line->shares as $memberId => $share) {
                    $contributions[$memberId] += $share;
                }
                continue;
            }

            $paid[$line->paidByMemberId] += $line->amountCents;
            foreach ($line->shares as $memberId => $share) {
                $owed[$memberId] += $share;
            }
        }

        $balances = $this->balanceCalculator->balances($memberIds, $paid, $owed);
        $transfers = array_map(static fn (array $transfer): array => [
            ...$transfer,
            'fromName' => $names[$transfer['from']],
            'toName'   => $names[$transfer['to']],
        ], $this->balanceCalculator->plan($balances));

        return [
            'contributions' => $contributions,
            'balances'      => $balances,
            'transfers'     => $transfers,
            'summary'       => $this->summarize($transfers, count($members), $currency),
        ];
    }

    /**
     * À deux membres, une seule phrase suffit : « B doit rembourser X € à A ».
     *
     * @param list<array{from: string, to: string, amountCents: int, fromName: string, toName: string}> $transfers
     */
    private function summarize(array $transfers, int $memberCount, string $currency): ?string
    {
        if ($memberCount !== 2) {
            return null;
        }

        if ($transfers === []) {
            return 'Les comptes sont équilibrés ce mois-ci.';
        }

        return sprintf(
            '%s doit rembourser %s à %s',
            $transfers[0]['fromName'],
            Money::formatCents($transfers[0]['amountCents'], $currency),
            $transfers[0]['toName']
        );
    }

    /**
     * @return array{id: string, displayName: string, status: string, role: string, userId: string|null}
     */
    private function describeMember(BoardMember $member): array
    {
        return [
            'id'          => (string) $member->getId(),
            'displayName' => (string) $member->getDisplayName(),
            'status'      => $member->getStatus()->value,
            'role'        => $member->getRole()->value,
            'userId'      => $member->getUserId(),
        ];
    }

    /**
     * @return array{id: string, name: string, color: string, hex: string}
     */
    private function describeTag(Tag $tag): array
    {
        return [
            'id'    => (string) $tag->getId(),
            'name'  => (string) $tag->getName(),
            'color' => $tag->getColor()->value,
            'hex'   => $tag->getColorHex(),
        ];
    }
}
