<?php

declare(strict_types=1);

namespace App\Calculator\Adjustment;

use App\Entity\BudgetItemAdjustment;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Applique l'exception d'un mois au montant calculé par la règle. Une implémentation par code `type`.
 */
#[AutoconfigureTag]
interface AdjustmentHandlerInterface
{
    public function apply(BudgetItemAdjustment $adjustment, Money $amount, BudgetItemRevision $revision, bool $isDue): Money;

    /**
     * @param array<string, mixed> $params
     *
     * @return array<string, string> champ => message (vide si valide)
     */
    public function validate(?int $amountCents, array $params): array;
}
