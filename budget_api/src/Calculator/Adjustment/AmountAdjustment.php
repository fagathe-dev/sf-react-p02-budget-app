<?php

declare(strict_types=1);

namespace App\Calculator\Adjustment;

use App\Entity\BudgetItemAdjustment;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * « Montant réel… » : la facture de mars à 97,40 € au lieu de 85 €.
 */
#[AsTaggedItem(self::CODE)]
final class AmountAdjustment implements AdjustmentHandlerInterface
{
    public const CODE = 'amount';

    public function apply(BudgetItemAdjustment $adjustment, Money $amount, BudgetItemRevision $revision, bool $isDue): Money
    {
        return $amount->withAmount((int) $adjustment->getAmountCents());
    }

    public function validate(?int $amountCents, array $params): array
    {
        if ($amountCents === null || $amountCents < 0) {
            return ['amountCents' => 'Le montant réel est obligatoire et ne peut pas être négatif.'];
        }

        return [];
    }
}
