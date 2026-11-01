<?php

namespace App\Repository;

use Symfony\Component\Uid\Uuid;

/**
 * Normalise les agrégats SQL « GROUP BY membre » en tableau memberId (RFC 4122) => centimes.
 */
trait SumByMemberTrait
{
    /**
     * @param list<array{memberId: Uuid|string, total: int|string|null}> $rows
     *
     * @return array<string, int>
     */
    private function indexSumsByMember(array $rows): array
    {
        $sums = [];
        foreach ($rows as $row) {
            $memberId = $row['memberId'] instanceof Uuid ? $row['memberId'] : Uuid::fromString((string) $row['memberId']);
            $sums[$memberId->toRfc4122()] = (int) $row['total'];
        }

        return $sums;
    }
}
