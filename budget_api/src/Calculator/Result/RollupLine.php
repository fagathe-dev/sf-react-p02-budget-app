<?php

declare(strict_types=1);

namespace App\Calculator\Result;

/**
 * Ma part d'un poste d'un board source (affichage détaillé de la remontée).
 */
final readonly class RollupLine
{
    /**
     * @param list<array{id: string, name: string, color: string, hex: string}> $tags
     */
    public function __construct(
        public string $sourceItemId,
        public string $kind,
        public string $label,
        public int $amountCents,
        public int $householdAmountCents,
        public bool $isDue,
        public bool $isMonthly,
        public bool $isVariable,
        public ?string $allocation,
        public ?int $dueDay,
        public bool $hasAdjustment,
        public array $tags,
    ) {}
}
