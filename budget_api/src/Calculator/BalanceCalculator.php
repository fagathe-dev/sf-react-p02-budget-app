<?php

declare(strict_types=1);

namespace App\Calculator;

/**
 * Soldes et plan de virements, partagés par les boards partagés et les groupes de dépenses.
 * Fonctions pures : les montants arrivent déjà agrégés.
 */
final class BalanceCalculator
{
    /**
     * Solde = payé - dû + remboursements envoyés - remboursements reçus. Positif : on lui doit de l'argent.
     *
     * @param list<string> $memberIds tous les membres, dans l'ordre de création
     * @param array<string, int> $paid
     * @param array<string, int> $owed
     * @param array<string, int> $sent
     * @param array<string, int> $received
     *
     * @return array<string, int>
     */
    public function balances(array $memberIds, array $paid, array $owed, array $sent = [], array $received = []): array
    {
        $balances = [];
        foreach ($memberIds as $memberId) {
            $balances[$memberId] = ($paid[$memberId] ?? 0)
                - ($owed[$memberId] ?? 0)
                + ($sent[$memberId] ?? 0)
                - ($received[$memberId] ?? 0);
        }

        return $balances;
    }

    /**
     * À chaque étape, le plus gros débiteur rembourse le plus gros créancier, du plus petit des deux montants.
     * Au plus n - 1 virements ; à montant égal, l'ordre de création départage (déterministe).
     *
     * @param array<string, int> $balances
     *
     * @return list<array{from: string, to: string, amountCents: int}>
     */
    public function plan(array $balances): array
    {
        $creditors = array_filter($balances, static fn (int $balance): bool => $balance > 0);
        $debtors = array_map('abs', array_filter($balances, static fn (int $balance): bool => $balance < 0));
        $transfers = [];

        while ($creditors !== [] && $debtors !== []) {
            $creditor = $this->largest($creditors);
            $debtor = $this->largest($debtors);
            $amount = min($creditors[$creditor], $debtors[$debtor]);

            $transfers[] = ['from' => $debtor, 'to' => $creditor, 'amountCents' => $amount];

            $creditors[$creditor] -= $amount;
            $debtors[$debtor] -= $amount;

            if ($creditors[$creditor] === 0) {
                unset($creditors[$creditor]);
            }
            if ($debtors[$debtor] === 0) {
                unset($debtors[$debtor]);
            }
        }

        return $transfers;
    }

    /**
     * @param array<string, int> $amounts
     */
    private function largest(array $amounts): string
    {
        $best = null;
        foreach ($amounts as $memberId => $amount) {
            if ($best === null || $amount > $amounts[$best]) {
                $best = (string) $memberId;
            }
        }

        return (string) $best;
    }
}
