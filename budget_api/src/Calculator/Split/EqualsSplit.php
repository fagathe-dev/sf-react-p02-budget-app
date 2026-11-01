<?php

declare(strict_types=1);

namespace App\Calculator\Split;

use App\Entity\Embeddable\Money;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Parts égales entre les membres concernés (50/50, 1/3…). Les valeurs saisies sont ignorées.
 */
#[AsTaggedItem(self::CODE)]
final class EqualsSplit implements SplitStrategyInterface
{
    public const CODE = 'equals';

    public function split(Money $amount, array $values): array
    {
        return RemainderDistributor::distribute(
            $amount->getAmountCents(),
            array_map(static fn (): int => 1, $values)
        );
    }

    public function validate(?Money $amount, array $values): array
    {
        return $values === [] ? ['entries' => 'Sélectionnez au moins un membre.'] : [];
    }
}
