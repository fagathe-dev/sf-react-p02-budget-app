<?php

declare(strict_types=1);

namespace App\Insight\Rule;

use App\Entity\Embeddable\Money;
use App\Enum\Budget\InsightLevelEnum;
use App\Enum\Budget\ItemKindEnum;
use App\Insight\Insight;
use App\Insight\InsightContext;
use App\Insight\InsightRuleInterface;

/**
 * Facture non mensuelle qui tombe ce mois-ci (électricité un mois sur deux).
 */
final class NonMonthlyDueRule implements InsightRuleInterface
{
    public function supports(InsightContext $context): bool
    {
        return true;
    }

    public function evaluate(InsightContext $context): array
    {
        $insights = [];
        $currency = $context->personal->currency;

        foreach ($context->personal->lines as $line) {
            if ($line->kind === ItemKindEnum::Expense->value && $line->isDue && !$line->isMonthly && $line->amountCents > 0) {
                $insights[] = $this->insight($line->itemId, $line->label, $line->amountCents, $currency, $context->personal->boardId, (string) $context->period);
            }
        }

        foreach ($context->personal->rollups as $rollup) {
            foreach ($rollup->lines as $line) {
                if ($line->kind === ItemKindEnum::Expense->value && $line->isDue && !$line->isMonthly && $line->amountCents > 0) {
                    $insights[] = $this->insight($line->sourceItemId, $line->label, $line->amountCents, $currency, $rollup->sourceBoardId, (string) $context->period);
                }
            }
        }

        return $insights;
    }

    private function insight(string $itemId, string $label, int $amountCents, string $currency, string $boardId, string $month): Insight
    {
        return new Insight(
            key: sprintf('non_monthly_due:%s', $itemId),
            level: InsightLevelEnum::Info,
            message: sprintf('« %s » tombe ce mois-ci : %s.', $label, Money::formatCents($amountCents, $currency)),
            link: sprintf('/boards/%s?month=%s', $boardId, $month),
            amountCents: $amountCents,
        );
    }
}
