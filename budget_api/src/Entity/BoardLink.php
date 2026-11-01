<?php

namespace App\Entity;

use App\Doctrine\Type\PeriodType;
use App\Repository\BoardLinkRepository;
use App\ValueObject\Period;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Lien entre deux boards, traité par le BoardLinkHandler de son type.
 * share_rollup : la part d'un membre du board source remonte dans son board perso (cible).
 */
#[ORM\Entity(repositoryClass: BoardLinkRepository::class)]
#[ORM\Index(name: 'idx_board_link_target', columns: ['target_board_id', 'active_from'])]
class BoardLink
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Board $sourceBoard = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Board $targetBoard = null;

    #[ORM\ManyToOne(targetEntity: BoardMember::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?BoardMember $member = null;

    #[ORM\Column(length: 32)]
    private ?string $type = null;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: Types::JSON)]
    private array $params = [];

    #[ORM\Column(type: PeriodType::NAME)]
    private ?Period $activeFrom = null;

    #[ORM\Column(type: PeriodType::NAME, nullable: true)]
    private ?Period $activeTo = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getSourceBoard(): ?Board
    {
        return $this->sourceBoard;
    }

    public function setSourceBoard(Board $sourceBoard): static
    {
        $this->sourceBoard = $sourceBoard;

        return $this;
    }

    public function getTargetBoard(): ?Board
    {
        return $this->targetBoard;
    }

    public function setTargetBoard(Board $targetBoard): static
    {
        $this->targetBoard = $targetBoard;

        return $this;
    }

    public function getMember(): ?BoardMember
    {
        return $this->member;
    }

    public function setMember(?BoardMember $member): static
    {
        $this->member = $member;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function getParams(): array
    {
        return $this->params;
    }

    /**
     * @param array<string, mixed> $params
     */
    public function setParams(array $params): static
    {
        $this->params = $params;

        return $this;
    }

    public function getActiveFrom(): ?Period
    {
        return $this->activeFrom;
    }

    public function setActiveFrom(Period $activeFrom): static
    {
        $this->activeFrom = $activeFrom;

        return $this;
    }

    public function getActiveTo(): ?Period
    {
        return $this->activeTo;
    }

    /**
     * Arrête la remontée après $lastPeriod (inclus).
     */
    public function close(Period $lastPeriod): static
    {
        $this->activeTo = $lastPeriod;

        return $this;
    }

    public function isActiveAt(Period $period): bool
    {
        return $this->activeFrom !== null
            && !$period->isBefore($this->activeFrom)
            && ($this->activeTo === null || !$period->isAfter($this->activeTo));
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}
