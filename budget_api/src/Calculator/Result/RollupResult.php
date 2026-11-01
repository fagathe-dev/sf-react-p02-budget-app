<?php

declare(strict_types=1);

namespace App\Calculator\Result;

/**
 * Ce qu'un BoardLink fait remonter dans le board cible : un total (affichage groupé) et ses lignes (détaillé).
 */
final readonly class RollupResult
{
    /**
     * @param list<RollupLine> $lines
     */
    public function __construct(
        public string $linkId,
        public string $type,
        public string $sourceBoardId,
        public string $sourceBoardName,
        public ?string $memberId,
        public int $expenseCents,
        public int $savingsCents,
        public ?int $contributionCents,
        public ?int $balanceCents,
        public array $lines,
    ) {}
}
