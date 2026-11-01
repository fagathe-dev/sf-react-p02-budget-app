<?php

declare(strict_types=1);

namespace App\Insight\Rule;

use App\Enum\Budget\InsightLevelEnum;
use App\Insight\Insight;
use App\Insight\InsightContext;
use App\Insight\InsightRuleInterface;

/**
 * Taux de charges (charges / revenus) au-dessus du seuil choisi dans les réglages (50 % par défaut).
 */
final class ChargesRatioRule implements InsightRuleInterface
{
    public function supports(InsightContext $context): bool
    {
        return $context->personal->totals['chargesRatio'] !== null;
    }

    public function evaluate(InsightContext $context): array
    {
        $ratio = (float) $context->personal->totals['chargesRatio'];
        $threshold = $context->chargesRatioThreshold();

        if ($ratio <= $threshold) {
            return [];
        }

        return [new Insight(
            key: 'charges_ratio',
            level: InsightLevelEnum::Warning,
            message: sprintf(
                'Vos charges représentent %s %% de vos revenus, au-dessus de votre seuil de %s %%.',
                number_format($ratio, 1, ',', ' '),
                number_format($threshold, 0, ',', ' ')
            ),
            link: sprintf('/boards/%s?month=%s', $context->personal->boardId, $context->period),
            amountCents: $context->personal->getTotal('chargesCents'),
        )];
    }
}
