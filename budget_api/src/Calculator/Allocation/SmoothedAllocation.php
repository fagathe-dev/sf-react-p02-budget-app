<?php

declare(strict_types=1);

namespace App\Calculator\Allocation;

use App\Calculator\Recurrence\Cycle;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Lissé : le montant réparti sur chaque mois du cycle (85 € tous les 2 mois = 42,50 €/mois),
 * arrondi au centime le plus proche.
 */
#[AsTaggedItem(self::CODE)]
final class SmoothedAllocation implements AllocationHandlerInterface
{
    public const CODE = 'smoothed';

    public function amountFor(BudgetItemRevision $revision, Period $period, bool $isDue, Cycle $cycle): Money
    {
        $amount = $revision->getAmount();
        $numerator = $amount->getAmountCents() * $cycle->occurrences;
        $denominator = max(1, $cycle->months);

        // Arrondi entier au plus proche, sans float
        $cents = intdiv(2 * abs($numerator) + $denominator, 2 * $denominator);

        return $amount->withAmount($numerator < 0 ? -$cents : $cents);
    }
}
