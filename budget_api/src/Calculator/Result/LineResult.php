<?php

declare(strict_types=1);

namespace App\Calculator\Result;

/**
 * Un poste calculé pour un mois, prêt à afficher (le front n'additionne jamais lui-même).
 */
final readonly class LineResult
{
    /**
     * @param list<array{id: string, name: string, color: string, hex: string}> $tags
     * @param array<string, int> $shares memberId => part du mois en centimes
     * @param array<string, mixed> $recurrenceParams
     */
    public function __construct(
        public string $itemId,
        public string $kind,
        public string $label,
        public int $position,
        public bool $isActive,
        public bool $isDue,
        public bool $isMonthly,
        public bool $isVariable,
        public int $amountCents,
        public ?int $ruleAmountCents,
        public ?string $recurrenceType,
        public ?string $allocation,
        public ?int $dueDay,
        public ?string $paidByMemberId,
        public ?string $adjustmentType,
        public array $tags,
        public array $shares,
        public array $recurrenceParams = [],
        public ?string $endPeriod = null,
    ) {}
}
