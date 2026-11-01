<?php

declare(strict_types=1);

namespace App\Calculator\Recurrence;

use App\Entity\BudgetItemRevision;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Dit si un poste tombe un mois donné. Une implémentation par code `recurrence_type`,
 * enregistrée avec #[AsTaggedItem('<code>')].
 */
#[AutoconfigureTag]
interface RecurrenceHandlerInterface
{
    public function isDue(BudgetItemRevision $revision, Period $period): bool;

    public function cycle(BudgetItemRevision $revision): Cycle;

    /**
     * Valide les paramètres JSON propres à la stratégie.
     *
     * @param array<string, mixed> $params
     *
     * @return array<string, string> champ => message (vide si valide)
     */
    public function validateParams(array $params): array;
}
