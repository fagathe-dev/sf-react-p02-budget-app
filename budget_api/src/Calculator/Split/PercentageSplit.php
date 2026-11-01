<?php

declare(strict_types=1);

namespace App\Calculator\Split;

use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Pourcentage par membre, en points de base (12,5 % = 1 250 ; total 10 000).
 */
#[AsTaggedItem(self::CODE)]
final class PercentageSplit implements SplitStrategyInterface
{
    public const CODE = 'percentage';
    public const TOTAL_BASIS_POINTS = 10000;

    public function split(Money $amount, array $values): array
    {
        return RemainderDistributor::distribute(
            $amount->getAmountCents(),
            array_map(static fn (?int $value): int => (int) $value, $values)
        );
    }

    public function validate(?Money $amount, array $values): array
    {
        foreach ($values as $value) {
            if ($value === null || $value < 0 || $value > self::TOTAL_BASIS_POINTS) {
                return ['entries' => 'Chaque pourcentage doit être compris entre 0 et 100 %.'];
            }
        }

        $total = array_sum($values);
        if ($total !== self::TOTAL_BASIS_POINTS) {
            return ['entries' => sprintf(
                'La somme des pourcentages doit faire 100 %% (reste à répartir : %s %%).',
                number_format((self::TOTAL_BASIS_POINTS - $total) / 100, 2, ',', ' ')
            )];
        }

        return [];
    }
}
