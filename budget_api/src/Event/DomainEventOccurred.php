<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\User;
use Symfony\Component\Uid\Uuid;

/**
 * Fait métier à journaliser (board.created, budget_item.revised, board.member_joined…).
 * DomainEventRecorder l'écrit dans DomainEvent ; les notifications (lot 3) s'y abonneront.
 */
final readonly class DomainEventOccurred
{
    /**
     * @param array<string, mixed> $payload
     */
    public function __construct(
        public string $aggregateType,
        public Uuid $aggregateId,
        public string $type,
        public array $payload = [],
        public ?User $actor = null,
    ) {}
}
