<?php

declare(strict_types=1);

namespace App\Calculator\Recurrence;

use App\Entity\BudgetItemRevision;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Facture à des mois précis de l'année : params {"months": [10]} (taxe foncière en octobre).
 */
#[AsTaggedItem(self::CODE)]
final class SpecificMonthsRecurrence implements RecurrenceHandlerInterface
{
    public const CODE = 'specific_months';

    public function isDue(BudgetItemRevision $revision, Period $period): bool
    {
        return in_array($period->getMonth(), $this->months($revision), true);
    }

    public function cycle(BudgetItemRevision $revision): Cycle
    {
        return new Cycle(max(1, count($this->months($revision))), 12);
    }

    public function validateParams(array $params): array
    {
        $months = $params['months'] ?? null;

        if (!is_array($months) || $months === [] || !array_is_list($months)) {
            return ['recurrenceParams.months' => 'Indiquez au moins un mois (1 à 12).'];
        }

        foreach ($months as $month) {
            if (!is_int($month) || $month < 1 || $month > 12) {
                return ['recurrenceParams.months' => 'Chaque mois doit être un nombre entre 1 et 12.'];
            }
        }

        if (count(array_unique($months)) !== count($months)) {
            return ['recurrenceParams.months' => 'Un même mois ne peut apparaître qu\'une fois.'];
        }

        return [];
    }

    /**
     * @return list<int>
     */
    private function months(BudgetItemRevision $revision): array
    {
        return array_values(array_map('intval', (array) $revision->getRecurrenceParam('months', [])));
    }
}
