<?php

declare(strict_types=1);

namespace App\Calculator\Split;

/**
 * Répartit un total entier au prorata de poids entiers, sans float, en garantissant somme des parts = total.
 * Les centimes restants vont, un par un, au plus gros poids puis au premier membre dans l'ordre reçu
 * (l'ordre de création) : 100 € entre 3 = 33,34 + 33,33 + 33,33.
 */
final class RemainderDistributor
{
    /**
     * @param array<string, int> $weights memberId => poids (les poids <= 0 sont ignorés)
     *
     * @return array<string, int> memberId => part
     */
    public static function distribute(int $total, array $weights): array
    {
        $weights = array_filter($weights, static fn (int $weight): bool => $weight > 0);
        if ($weights === []) {
            return [];
        }

        $sign = $total < 0 ? -1 : 1;
        $absTotal = abs($total);
        $weightSum = array_sum($weights);

        $shares = [];
        foreach ($weights as $memberId => $weight) {
            $shares[$memberId] = intdiv($absTotal * $weight, $weightSum);
        }

        // Ordre de priorité : poids décroissant, puis ordre d'arrivée (tri stable)
        $priority = array_keys($weights);
        $position = array_flip($priority);
        usort($priority, static fn (string|int $a, string|int $b): int => [$weights[$b], $position[$a]] <=> [$weights[$a], $position[$b]]);

        $remaining = $absTotal - array_sum($shares);
        for ($i = 0; $remaining > 0; $i++, $remaining--) {
            $shares[$priority[$i % count($priority)]]++;
        }

        if ($sign < 0) {
            $shares = array_map(static fn (int $share): int => -$share, $shares);
        }

        return $shares;
    }
}
