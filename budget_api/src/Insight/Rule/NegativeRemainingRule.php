<?php

declare(strict_types=1);

namespace App\Insight\Rule;

use App\Entity\Embeddable\Money;
use App\Enum\Budget\InsightLevelEnum;
use App\Insight\Insight;
use App\Insight\InsightContext;
use App\Insight\InsightRuleInterface;

final class NegativeRemainingRule implements InsightRuleInterface
{
    public function supports(InsightContext $context): bool
    {
        return $context->personal->getTotal('incomeCents') > 0 || $context->personal->getTotal('chargesCents') > 0;
    }

    public function evaluate(InsightContext $context): array
    {
        $remaining = $context->personal->getTotal('remainingCents');
        if ($remaining >= 0) {
            return [];
        }

        return [new Insight(
            key: 'negative_remaining',
            level: InsightLevelEnum::Alert,
            message: sprintf('Votre reste à vivre est négatif ce mois-ci : %s.', Money::formatCents($remaining, $context->personal->currency)),
            link: sprintf('/boards/%s?month=%s', $context->personal->boardId, $context->period),
            amountCents: abs($remaining),
        )];
    }
}
