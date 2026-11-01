<?php

namespace App\Entity;

use App\Doctrine\Type\PeriodType;
use App\Repository\BudgetItemAdjustmentRepository;
use App\ValueObject\Period;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Exception d'un mois : « compter », « ne pas compter » ou montant réel.
 * Immuable : revenir à la règle supprime la ligne, en changer la remplace.
 */
#[ORM\Entity(repositoryClass: BudgetItemAdjustmentRepository::class, readOnly: true)]
#[ORM\UniqueConstraint(name: 'uniq_adjustment_item_period', columns: ['item_id', 'period'])]
class BudgetItemAdjustment
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    /**
     * @param array<string, mixed> $params
     */
    public function __construct(
        #[ORM\ManyToOne(targetEntity: BudgetItem::class), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private BudgetItem $item,
        #[ORM\Column(type: PeriodType::NAME)]
        private Period $period,
        #[ORM\Column(length: 32)]
        private string $type,                    // code ouvert : 'exclude', 'include', 'amount'…
        #[ORM\Column(type: Types::BIGINT, nullable: true)]
        private ?int $amountCents = null,        // dans la devise du board
        #[ORM\Column(type: Types::JSON)]
        private array $params = [],
        #[ORM\Column(length: 255, nullable: true)]
        private ?string $note = null,
        #[ORM\ManyToOne(targetEntity: User::class), ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?User $createdBy = null,
    ) {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getItem(): BudgetItem
    {
        return $this->item;
    }

    public function getPeriod(): Period
    {
        return $this->period;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getAmountCents(): ?int
    {
        return $this->amountCents;
    }

    /**
     * @return array<string, mixed>
     */
    public function getParams(): array
    {
        return $this->params;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return array<string, mixed>
     */
    public function toSnapshot(): array
    {
        return [
            'period'      => $this->period->toString(),
            'type'        => $this->type,
            'amountCents' => $this->amountCents,
            'params'      => $this->params,
            'note'        => $this->note,
        ];
    }
}
