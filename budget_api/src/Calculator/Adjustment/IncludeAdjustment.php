<?php

declare(strict_types=1);

namespace App\Calculator\Adjustment;

use App\Entity\BudgetItemAdjustment;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * « Compter » : le montant normal, même hors échéance (facture décalée d'un mois).
 */
#[AsTaggedItem(self::CODE)]
final class IncludeAdjustment implements AdjustmentHandlerInterface
{
    public const CODE = 'include';

    public function apply(BudgetItemAdjustment $adjustment, Money $amount, BudgetItemRevision $revision, bool $isDue): Money
    {
        return $isDue || !$amount->isZero() ? $amount : $revision->getAmount();
    }

    public function validate(?int $amountCents, array $params): array
    {
        return [];
    }
}
