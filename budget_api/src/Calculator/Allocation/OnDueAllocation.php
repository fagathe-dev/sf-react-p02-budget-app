<?php

declare(strict_types=1);

namespace App\Calculator\Allocation;

use App\Calculator\Recurrence\Cycle;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * À l'échéance (par défaut) : le montant entier le mois où il tombe, 0 les autres mois.
 */
#[AsTaggedItem(self::CODE)]
final class OnDueAllocation implements AllocationHandlerInterface
{
    public const CODE = 'on_due';

    public function amountFor(BudgetItemRevision $revision, Period $period, bool $isDue, Cycle $cycle): Money
    {
        return $isDue ? $revision->getAmount() : Money::zero($revision->getAmount()->getCurrency());
    }
}
