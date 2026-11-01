<?php

declare(strict_types=1);

namespace App\Calculator\Split;

use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Montant fixe par membre, en centimes. Pour une dépense, la somme doit égaler le montant (validation).
 * Sur un poste de board dont le montant du mois diffère (lissé, exception, 0 hors échéance),
 * les montants saisis servent de poids : la somme des parts reste égale au montant du mois.
 */
#[AsTaggedItem(self::CODE)]
final class AmountSplit implements SplitStrategyInterface
{
    public const CODE = 'amount';

    public function split(Money $amount, array $values): array
    {
        $values = array_map(static fn (?int $value): int => (int) $value, $values);

        if (array_sum($values) === $amount->getAmountCents()) {
            return array_filter($values, static fn (int $value): bool => $value > 0);
        }

        $weights = array_sum($values) > 0 ? $values : array_map(static fn (): int => 1, $values);

        return RemainderDistributor::distribute($amount->getAmountCents(), $weights);
    }

    public function validate(?Money $amount, array $values): array
    {
        foreach ($values as $value) {
            if ($value === null || $value < 0) {
                return ['entries' => 'Chaque montant doit être positif ou nul.'];
            }
        }

        if (array_sum($values) <= 0) {
            return ['entries' => 'Indiquez un montant pour au moins un membre.'];
        }

        if ($amount !== null && array_sum($values) !== $amount->getAmountCents()) {
            return ['entries' => sprintf(
                'La somme des montants doit égaler le montant de la dépense (reste à répartir : %s).',
                Money::formatCents($amount->getAmountCents() - array_sum($values), $amount->getCurrency())
            )];
        }

        return [];
    }
}
