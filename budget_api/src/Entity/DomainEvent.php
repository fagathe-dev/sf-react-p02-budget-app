<?php

namespace App\Entity;

use App\Repository\DomainEventRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Journal métier : ajout seul, jamais modifié (historique « ce qui a changé », notifications).
 */
#[ORM\Entity(repositoryClass: DomainEventRepository::class, readOnly: true)]
#[ORM\Index(name: 'idx_domain_event_aggregate', columns: ['aggregate_type', 'aggregate_id', 'occurred_at'])]
class DomainEvent
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column]
    private \DateTimeImmutable $occurredAt;

    /**
     * @param array<string, mixed> $payload
     */
    public function __construct(
        #[ORM\Column(length: 64)]
        private string $aggregateType,
        #[ORM\Column(type: UuidType::NAME)]
        private Uuid $aggregateId,
        #[ORM\Column(length: 64)]
        private string $type,
        #[ORM\Column(type: Types::JSON)]
        private array $payload = [],
        #[ORM\ManyToOne(targetEntity: User::class), ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?User $actor = null,
        ?\DateTimeImmutable $occurredAt = null,
    ) {
        $this->id = Uuid::v7();
        $this->occurredAt = $occurredAt ?? new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getAggregateType(): string
    {
        return $this->aggregateType;
    }

    public function getAggregateId(): Uuid
    {
        return $this->aggregateId;
    }

    public function getType(): string
    {
        return $this->type;
    }

    /**
     * @return array<string, mixed>
     */
    public function getPayload(): array
    {
        return $this->payload;
    }

    public function getActor(): ?User
    {
        return $this->actor;
    }

    public function getOccurredAt(): \DateTimeImmutable
    {
        return $this->occurredAt;
    }
}
