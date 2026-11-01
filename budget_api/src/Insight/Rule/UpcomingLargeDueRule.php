<?php

declare(strict_types=1);

namespace App\Insight\Rule;

use App\Calculator\Allocation\OnDueAllocation;
use App\Calculator\Result\BoardResult;
use App\Entity\Embeddable\Money;
use App\Enum\Budget\InsightLevelEnum;
use App\Enum\Budget\ItemKindEnum;
use App\Insight\Insight;
use App\Insight\InsightContext;
use App\Insight\InsightRuleInterface;
use App\ValueObject\Period;

/**
 * Grosse échéance non mensuelle dans les 2 prochains mois (taxe foncière…) : « pensez à provisionner ».
 */
final class UpcomingLargeDueRule implements InsightRuleInterface
{
    public function supports(InsightContext $context): bool
    {
        return $context->upcoming !== [];
    }

    public function evaluate(InsightContext $context): array
    {
        $insights = [];
        $threshold = $context->largeDueThresholdCents();

        foreach ($context->upcoming as $month => $result) {
            foreach ($this->dueLines($result) as $line) {
                if ($line['amountCents'] < $threshold) {
                    continue;
                }

                $insights[] = new Insight(
                    key: sprintf('upcoming_large_due:%s:%s', $line['itemId'], $month),
                    level: InsightLevelEnum::Warning,
                    message: sprintf(
                        '« %s » tombe en %s : %s. Pensez à provisionner.',
                        $line['label'],
                        $this->monthLabel(Period::fromString($month)),
                        Money::formatCents($line['amountCents'], $result->currency)
                    ),
                    link: sprintf('/boards/%s?month=%s', $line['boardId'], $month),
                    amountCents: $line['amountCents'],
                );
            }
        }

        return $insights;
    }

    /**
     * Postes perso et parts remontées, à l'échéance, non mensuels, qui tombent ce mois-là.
     *
     * @return list<array{itemId: string, label: string, amountCents: int, boardId: string}>
     */
    private function dueLines(BoardResult $result): array
    {
        $lines = [];

        foreach ($result->lines as $line) {
            if ($line->kind === ItemKindEnum::Expense->value && $line->isDue && !$line->isMonthly && $line->allocation === OnDueAllocation::CODE) {
                $lines[] = ['itemId' => $line->itemId, 'label' => $line->label, 'amountCents' => $line->amountCents, 'boardId' => $result->boardId];
            }
        }

        foreach ($result->rollups as $rollup) {
            foreach ($rollup->lines as $line) {
                if ($line->kind === ItemKindEnum::Expense->value && $line->isDue && !$line->isMonthly && $line->allocation === OnDueAllocation::CODE) {
                    $lines[] = ['itemId' => $line->sourceItemId, 'label' => $line->label, 'amountCents' => $line->amountCents, 'boardId' => $rollup->sourceBoardId];
                }
            }
        }

        return $lines;
    }

    private function monthLabel(Period $period): string
    {
        $months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

        return sprintf('%s %d', $months[$period->getMonth() - 1], $period->getYear());
    }
}
