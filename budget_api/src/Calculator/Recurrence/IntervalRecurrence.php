<?php

declare(strict_types=1);

namespace App\Calculator\Recurrence;

use App\Entity\BudgetItemRevision;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Tous les N mois à partir de l'ancre : params {"interval": 2, "anchor": "2026-01"}.
 * Sans ancre, la révision sert de référence. Mensuel = interval 1.
 */
#[AsTaggedItem(self::CODE)]
final class IntervalRecurrence implements RecurrenceHandlerInterface
{
    public const CODE = 'interval';
    private const MAX_INTERVAL = 120;

    public function isDue(BudgetItemRevision $revision, Period $period): bool
    {
        $elapsed = $period->monthsSince($this->anchor($revision));

        return $elapsed >= 0 && $elapsed % $this->interval($revision) === 0;
    }

    public function cycle(BudgetItemRevision $revision): Cycle
    {
        return new Cycle(1, $this->interval($revision));
    }

    public function validateParams(array $params): array
    {
        $errors = [];
        $interval = $params['interval'] ?? 1;

        if (!is_int($interval) || $interval < 1 || $interval > self::MAX_INTERVAL) {
            $errors['recurrenceParams.interval'] = sprintf('L\'intervalle doit être un nombre de mois entre 1 et %d.', self::MAX_INTERVAL);
        }

        if (isset($params['anchor']) && !Period::isValid(is_string($params['anchor']) ? $params['anchor'] : null)) {
            $errors['recurrenceParams.anchor'] = 'Le mois de référence doit être au format AAAA-MM.';
        }

        return $errors;
    }

    private function interval(BudgetItemRevision $revision): int
    {
        return max(1, (int) $revision->getRecurrenceParam('interval', 1));
    }

    private function anchor(BudgetItemRevision $revision): Period
    {
        $anchor = $revision->getRecurrenceParam('anchor');

        return is_string($anchor) && Period::isValid($anchor)
            ? Period::fromString($anchor)
            : $revision->getEffectiveFrom();
    }
}
