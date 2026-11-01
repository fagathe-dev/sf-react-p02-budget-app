<?php

declare(strict_types=1);

namespace App\Calculator;

use App\Entity\BudgetItem;
use App\Entity\BudgetItemRevision;
use App\ValueObject\Period;

/**
 * La règle du mois M = la dernière révision avec effective_from <= M.
 * Les révisions sont préchargées avec les postes (BudgetItemRepository::findForCalculation).
 */
final class RevisionResolver
{
    public function resolve(BudgetItem $item, Period $period): ?BudgetItemRevision
    {
        $current = null;

        foreach ($item->getRevisions() as $revision) {
            if ($revision->getEffectiveFrom()->isAfter($period)) {
                continue;
            }

            if ($current === null || $revision->getEffectiveFrom()->isAfter($current->getEffectiveFrom())) {
                $current = $revision;
            }
        }

        return $current;
    }
}
