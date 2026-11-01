<?php

declare(strict_types=1);

namespace App\Calculator\Result;

/**
 * Board calculé pour un mois : rien n'est stocké, tout est recalculé à chaque lecture.
 */
final readonly class BoardResult
{
    /**
     * @param list<array{id: string, displayName: string, status: string, role: string, userId: string|null}> $members
     * @param list<LineResult> $lines
     * @param list<RollupResult> $rollups
     * @param array<string, int|float|null> $totals
     * @param array<string, int> $memberShares memberId => total de ses parts du mois
     * @param array<string, mixed>|null $balance versements au compte commun, soldes et virements (board partagé)
     */
    public function __construct(
        public string $boardId,
        public string $type,
        public string $name,
        public string $currency,
        public string $period,
        public array $members,
        public array $lines,
        public array $rollups,
        public array $totals,
        public array $memberShares,
        public ?array $balance,
    ) {}

    public function getTotal(string $key): int
    {
        return (int) ($this->totals[$key] ?? 0);
    }

    public function findMemberIdForUser(string $userId): ?string
    {
        foreach ($this->members as $member) {
            if ($member['userId'] === $userId) {
                return $member['id'];
            }
        }

        return null;
    }
}
