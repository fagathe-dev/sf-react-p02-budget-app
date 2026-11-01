<?php

namespace App\Entity;

use App\Entity\Embeddable\Money;
use App\Repository\SettlementRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Uid\Uuid;

/**
 * Remboursement d'un participant à un autre. Annuler = voidedAt, jamais de suppression.
 */
#[ORM\Entity(repositoryClass: SettlementRepository::class)]
#[ORM\Index(name: 'idx_settlement_board', columns: ['board_id', 'settled_on'])]
class Settlement
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['settlement.read'])]
    private Uuid $id;

    #[ORM\Column(nullable: true)]
    #[Groups(['settlement.read'])]
    private ?\DateTimeImmutable $voidedAt = null;

    #[ORM\Column]
    #[Groups(['settlement.read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        #[ORM\ManyToOne(targetEntity: Board::class), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private Board $board,
        #[ORM\ManyToOne(targetEntity: BoardMember::class), ORM\JoinColumn(name: 'from_member_id', nullable: false, onDelete: 'CASCADE')]
        private BoardMember $fromMember,
        #[ORM\ManyToOne(targetEntity: BoardMember::class), ORM\JoinColumn(name: 'to_member_id', nullable: false, onDelete: 'CASCADE')]
        private BoardMember $toMember,
        #[ORM\Embedded(class: Money::class, columnPrefix: false)]
        #[Groups(['settlement.read'])]
        private Money $amount,
        #[ORM\Column(type: Types::DATE_IMMUTABLE)]
        #[Groups(['settlement.read'])]
        private \DateTimeImmutable $settledOn,
        #[ORM\Column(length: 255, nullable: true)]
        #[Groups(['settlement.read'])]
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

    public function getBoard(): Board
    {
        return $this->board;
    }

    public function getFromMember(): BoardMember
    {
        return $this->fromMember;
    }

    #[Groups(['settlement.read'])]
    #[SerializedName('fromMemberId')]
    public function getFromMemberId(): string
    {
        return $this->fromMember->getId()->toRfc4122();
    }

    public function getToMember(): BoardMember
    {
        return $this->toMember;
    }

    #[Groups(['settlement.read'])]
    #[SerializedName('toMemberId')]
    public function getToMemberId(): string
    {
        return $this->toMember->getId()->toRfc4122();
    }

    public function getAmount(): Money
    {
        return $this->amount;
    }

    public function getSettledOn(): \DateTimeImmutable
    {
        return $this->settledOn;
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

    public function getVoidedAt(): ?\DateTimeImmutable
    {
        return $this->voidedAt;
    }

    public function void(\DateTimeImmutable $now): static
    {
        $this->voidedAt ??= $now;

        return $this;
    }

    #[Groups(['settlement.read'])]
    #[SerializedName('isVoided')]
    public function isVoided(): bool
    {
        return $this->voidedAt !== null;
    }
}
