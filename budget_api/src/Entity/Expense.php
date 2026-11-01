<?php

namespace App\Entity;

use App\Entity\Embeddable\Money;
use App\Repository\ExpenseRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Uid\Uuid;

/**
 * Dépense réelle et datée d'un groupe. Immuable sauf void() : corriger = nouvelle dépense
 * qui remplace l'ancienne (supersedes), pour que les soldes passés restent explicables.
 * Pas en readOnly, sinon Doctrine ignorerait l'écriture de voidedAt.
 */
#[ORM\Entity(repositoryClass: ExpenseRepository::class)]
#[ORM\Index(name: 'idx_expense_board_spent', columns: ['board_id', 'spent_on'])]
class Expense
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['expense.read'])]
    private Uuid $id;

    #[ORM\Column(nullable: true)]
    #[Groups(['expense.read'])]
    private ?\DateTimeImmutable $voidedAt = null;

    #[ORM\Column]
    #[Groups(['expense.read'])]
    private \DateTimeImmutable $createdAt;

    /**
     * @var Collection<int, ExpenseShare>
     */
    #[ORM\OneToMany(targetEntity: ExpenseShare::class, mappedBy: 'expense', cascade: ['persist'])]
    #[Groups(['expense.read'])]
    private Collection $shares;

    public function __construct(
        #[ORM\ManyToOne(targetEntity: Board::class), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private Board $board,
        #[ORM\ManyToOne(targetEntity: BoardMember::class), ORM\JoinColumn(name: 'paid_by_member_id', nullable: false, onDelete: 'CASCADE')]
        private BoardMember $paidBy,
        #[ORM\Column(length: 120)]
        #[Groups(['expense.read'])]
        private string $label,
        #[ORM\Embedded(class: Money::class, columnPrefix: false)]
        #[Groups(['expense.read'])]
        private Money $amount,
        #[ORM\Column(type: Types::DATE_IMMUTABLE)]
        #[Groups(['expense.read'])]
        private \DateTimeImmutable $spentOn,
        #[ORM\Column(length: 32)]
        #[Groups(['expense.read'])]
        private string $splitStrategy,           // code ouvert : 'equals', 'amount', 'percentage'…
        #[ORM\ManyToOne(targetEntity: Tag::class), ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?Tag $tag = null,
        #[ORM\ManyToOne(targetEntity: self::class), ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?Expense $supersedes = null,
        #[ORM\ManyToOne(targetEntity: User::class), ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?User $createdBy = null,
    ) {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->shares = new ArrayCollection();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getBoard(): Board
    {
        return $this->board;
    }

    public function getPaidBy(): BoardMember
    {
        return $this->paidBy;
    }

    #[Groups(['expense.read'])]
    #[SerializedName('paidByMemberId')]
    public function getPaidByMemberId(): string
    {
        return $this->paidBy->getId()->toRfc4122();
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function getAmount(): Money
    {
        return $this->amount;
    }

    public function getSpentOn(): \DateTimeImmutable
    {
        return $this->spentOn;
    }

    public function getSplitStrategy(): string
    {
        return $this->splitStrategy;
    }

    public function getTag(): ?Tag
    {
        return $this->tag;
    }

    #[Groups(['expense.read'])]
    #[SerializedName('tagId')]
    public function getTagId(): ?string
    {
        return $this->tag?->getId()?->toRfc4122();
    }

    public function getSupersedes(): ?Expense
    {
        return $this->supersedes;
    }

    #[Groups(['expense.read'])]
    #[SerializedName('supersedesId')]
    public function getSupersedesId(): ?string
    {
        return $this->supersedes?->getId()->toRfc4122();
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
     * Part figée à l'enregistrement : un participant ajouté plus tard ne change rien.
     */
    public function addShare(BoardMember $member, int $amountCents, ?int $inputValue = null): static
    {
        $this->shares->add(new ExpenseShare($this, $member, $amountCents, $inputValue));

        return $this;
    }

    /**
     * @return Collection<int, ExpenseShare>
     */
    public function getShares(): Collection
    {
        return $this->shares;
    }

    public function getVoidedAt(): ?\DateTimeImmutable
    {
        return $this->voidedAt;
    }

    /**
     * Seule écriture autorisée après l'enregistrement.
     */
    public function void(\DateTimeImmutable $now): static
    {
        $this->voidedAt ??= $now;

        return $this;
    }

    #[Groups(['expense.read'])]
    #[SerializedName('isVoided')]
    public function isVoided(): bool
    {
        return $this->voidedAt !== null;
    }
}
