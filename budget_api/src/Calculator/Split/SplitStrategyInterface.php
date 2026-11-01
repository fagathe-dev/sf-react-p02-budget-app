<?php

declare(strict_types=1);

namespace App\Calculator\Split;

use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Répartit un montant entre membres. Partagée par les boards (SplitRule) et les dépenses (Expense).
 * Une implémentation par code `strategy`.
 */
#[AutoconfigureTag]
interface SplitStrategyInterface
{
    /**
     * @param array<string, int|null> $values memberId => saisie (vide, centimes ou points de base),
     *                                        dans l'ordre de création des membres
     *
     * @return array<string, int> memberId => part en centimes ; somme = montant ; un membre à 0 n'a pas de part
     */
    public function split(Money $amount, array $values): array;

    /**
     * @param Money|null $amount null quand la règle est posée sans montant connu (règle de board)
     * @param array<string, int|null> $values
     *
     * @return array<string, string> champ => message (vide si valide)
     */
    public function validate(?Money $amount, array $values): array;
}
