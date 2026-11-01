<?php

declare(strict_types=1);

namespace App\Calculator\Allocation;

use App\Calculator\Recurrence\Cycle;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Montant d'un poste pour le mois : entier à l'échéance, lissé… Une implémentation par code `allocation`.
 */
#[AutoconfigureTag]
interface AllocationHandlerInterface
{
    public function amountFor(BudgetItemRevision $revision, Period $period, bool $isDue, Cycle $cycle): Money;
}
