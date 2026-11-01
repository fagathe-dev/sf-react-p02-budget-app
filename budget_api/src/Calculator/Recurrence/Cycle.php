<?php

declare(strict_types=1);

namespace App\Calculator\Recurrence;

/**
 * Rythme d'un poste : $occurrences échéances tous les $months mois.
 * Sert au mode lissé : montant x occurrences / mois (tous les 2 mois = 1/2, mars et octobre = 2/12).
 */
final readonly class Cycle
{
    public function __construct(
        public int $occurrences,
        public int $months,
    ) {}

    public function isMonthly(): bool
    {
        return $this->occurrences === $this->months;
    }
}
