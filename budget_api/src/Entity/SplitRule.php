<?php

namespace App\Entity;

use App\Doctrine\Type\PeriodType;
use App\Repository\SplitRuleRepository;
use App\ValueObject\Period;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Règle de répartition datée : celle du board (item = null) ou propre à un poste.
 * Le sens de SplitRuleEntry::value dépend de la stratégie (vide, centimes ou points de base).
 */
#[ORM\Entity(repositoryClass: SplitRuleRepository::class, readOnly: true)]
#[ORM\Index(name: 'idx_split_rule_board_period', columns: ['board_id', 'effective_from'])]
class SplitRule
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    /**
     * @var Collection<int, SplitRuleEntry>
     */
    #[ORM\OneToMany(targetEntity: SplitRuleEntry::class, mappedBy: 'splitRule', cascade: ['persist'])]
    private Collection $entries;

    public function __construct(
        #[ORM\ManyToOne(targetEntity: Board::class), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private Board $board,
        #[ORM\Column(type: PeriodType::NAME)]
        private Period $effectiveFrom,
        #[ORM\Column(length: 32)]
        private string $strategy,                // code ouvert : 'equals', 'amount', 'percentage'…
        #[ORM\ManyToOne(targetEntity: BudgetItem::class), ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
        private ?BudgetItem $item = null,
        #[ORM\ManyToOne(targetEntity: User::class), ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?User $createdBy = null,
    ) {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->entries = new ArrayCollection();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getBoard(): Board
    {
        return $this->board;
    }

    public function getItem(): ?BudgetItem
    {
        return $this->item;
    }

    public function getEffectiveFrom(): Period
    {
        return $this->effectiveFrom;
    }

    public function getStrategy(): string
    {
        return $this->strategy;
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
     * À appeler avant la première persistance : la règle est ensuite figée.
     */
    public function addEntry(BoardMember $member, ?int $value = null): static
    {
        $this->entries->add(new SplitRuleEntry($this, $member, $value));

        return $this;
    }

    /**
     * @return Collection<int, SplitRuleEntry>
     */
    public function getEntries(): Collection
    {
        return $this->entries;
    }

    /**
     * Saisie par membre (memberId => valeur), pour les stratégies de répartition.
     *
     * @return array<string, int|null>
     */
    public function getValuesByMember(): array
    {
        $values = [];
        foreach ($this->entries as $entry) {
            $values[(string) $entry->getMember()->getId()] = $entry->getValue();
        }

        return $values;
    }
}
