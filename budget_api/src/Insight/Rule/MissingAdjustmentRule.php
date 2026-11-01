<?php

declare(strict_types=1);

namespace App\Insight\Rule;

use App\Calculator\Result\BoardResult;
use App\Calculator\Result\LineResult;
use App\Enum\Budget\InsightLevelEnum;
use App\Insight\Insight;
use App\Insight\InsightContext;
use App\Insight\InsightRuleInterface;
use App\ValueObject\Period;

/**
 * Facture variable (recurrence_params.variable) déjà échue sans montant réel saisi : suggestion.
 */
final class MissingAdjustmentRule implements InsightRuleInterface
{
    public function supports(InsightContext $context): bool
    {
        return $context->isStarted();
    }

    public function evaluate(InsightContext $context): array
    {
        $insights = [];

        foreach ([$context->personal, ...$context->sharedBoards] as $board) {
            foreach ($this->missing($board, $context) as $line) {
                $insights[] = new Insight(
                    key: sprintf('missing_adjustment:%s:%s', $line->itemId, $context->period),
                    level: InsightLevelEnum::Suggestion,
                    message: sprintf('Saisissez le montant réel de « %s » pour ce mois-ci.', $line->label),
                    link: sprintf('/boards/%s?month=%s', $board->boardId, $context->period),
                    amountCents: $line->amountCents,
                );
            }
        }

        return $insights;
    }

    /**
     * @return list<LineResult>
     */
    private function missing(BoardResult $board, InsightContext $context): array
    {
        $isCurrentMonth = Period::fromDate($context->today)->equals($context->period);
        $today = (int) $context->today->format('j');

        return array_values(array_filter(
            $board->lines,
            static fn (LineResult $line): bool => $line->isActive
                && $line->isDue
                && $line->isVariable
                && $line->adjustmentType === null
                && (!$isCurrentMonth || ($line->dueDay !== null && $line->dueDay <= $today))
        ));
    }
}
