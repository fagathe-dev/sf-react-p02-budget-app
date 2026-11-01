<?php

declare(strict_types=1);

namespace App\Calculator\Adjustment;

use App\Entity\BudgetItemAdjustment;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * « Ne pas compter » ce mois-ci.
 */
#[AsTaggedItem(self::CODE)]
final class ExcludeAdjustment implements AdjustmentHandlerInterface
{
    public const CODE = 'exclude';

    public function apply(BudgetItemAdjustment $adjustment, Money $amount, BudgetItemRevision $revision, bool $isDue): Money
    {
        return Money::zero($amount->getCurrency());
    }

    public function validate(?int $amountCents, array $params): array
    {
        return [];
    }
}
