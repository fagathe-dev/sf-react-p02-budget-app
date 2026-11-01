<?php

declare(strict_types=1);

namespace App\Calculator\Recurrence;

use App\Entity\BudgetItemRevision;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Poste ponctuel : il ne tombe que le mois de sa révision (startMonth = endMonth).
 * ItemService fixe end_period sur ce même mois.
 */
#[AsTaggedItem(self::CODE)]
final class OneOffRecurrence implements RecurrenceHandlerInterface
{
    public const CODE = 'one_off';

    public function isDue(BudgetItemRevision $revision, Period $period): bool
    {
        return $period->equals($revision->getEffectiveFrom());
    }

    public function cycle(BudgetItemRevision $revision): Cycle
    {
        return new Cycle(1, 1);
    }

    public function validateParams(array $params): array
    {
        return [];
    }
}
