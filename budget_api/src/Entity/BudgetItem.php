<?php

namespace App\Entity;

use App\Enum\Budget\ItemKindEnum;
use App\Repository\BudgetItemRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Un poste dit seulement QUOI : le combien, le quand et le qui paie vivent dans les révisions datées.
 */
#[ORM\Entity(repositoryClass: BudgetItemRepository::class)]
#[ORM\Index(name: 'idx_budget_item_board_position', columns: ['board_id', 'position'])]
class BudgetItem
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Board $board = null;

    #[ORM\Column(length: 32, enumType: ItemKindEnum::class)]
    private ItemKindEnum $kind = ItemKindEnum::Expense;

    #[ORM\Column(length: 120)]
    private ?string $label = null;

    #[ORM\Column(options: ['default' => 0])]
    private int $position = 0;

    /**
     * Simulation : un poste désactivé compte pour 0 sur tous les mois, sans être supprimé.
     */
    #[ORM\Column(options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $archivedAt = null;

    /**
     * @var Collection<int, BudgetItemRevision>
     */
    #[ORM\OneToMany(targetEntity: BudgetItemRevision::class, mappedBy: 'item', cascade: ['persist'])]
    #[ORM\OrderBy(['effectiveFrom' => 'ASC'])]
    private Collection $revisions;

    /**
     * @var Collection<int, BudgetItemTag>
     */
    #[ORM\OneToMany(targetEntity: BudgetItemTag::class, mappedBy: 'item', cascade: ['persist'], orphanRemoval: true)]
    private Collection $itemTags;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->revisions = new ArrayCollection();
        $this->itemTags = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getBoard(): ?Board
    {
        return $this->board;
    }

    public function setBoard(Board $board): static
    {
        $this->board = $board;

        return $this;
    }

    public function getKind(): ItemKindEnum
    {
        return $this->kind;
    }

    public function setKind(ItemKindEnum $kind): static
    {
        $this->kind = $kind;

        return $this;
    }

    public function getLabel(): ?string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = $label;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function toggle(): static
    {
        $this->isActive = !$this->isActive;

        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
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

    public function getArchivedAt(): ?\DateTimeImmutable
    {
        return $this->archivedAt;
    }

    /**
     * Suppression logique : les révisions et le journal gardent leurs références.
     */
    public function archive(\DateTimeImmutable $now): static
    {
        $this->archivedAt ??= $now;

        return $this;
    }

    public function isArchived(): bool
    {
        return $this->archivedAt !== null;
    }

    /**
     * @return Collection<int, BudgetItemRevision>
     */
    public function getRevisions(): Collection
    {
        return $this->revisions;
    }

    public function addRevision(BudgetItemRevision $revision): static
    {
        if (!$this->revisions->contains($revision)) {
            $this->revisions->add($revision);
        }

        return $this;
    }

    public function removeRevision(BudgetItemRevision $revision): static
    {
        $this->revisions->removeElement($revision);

        return $this;
    }

    /**
     * @return list<Tag>
     */
    public function getTags(): array
    {
        return array_values($this->itemTags->map(static fn (BudgetItemTag $itemTag): Tag => $itemTag->getTag())->toArray());
    }

    /**
     * Remplace les tags du poste : les liaisons conservées ne sont pas recréées.
     *
     * @param list<Tag> $tags
     */
    public function syncTags(array $tags): static
    {
        $wanted = [];
        foreach ($tags as $tag) {
            $wanted[(string) $tag->getId()] = $tag;
        }

        foreach ($this->itemTags->toArray() as $itemTag) {
            $tagId = (string) $itemTag->getTag()->getId();
            if (!isset($wanted[$tagId])) {
                $this->itemTags->removeElement($itemTag);
            }
            unset($wanted[$tagId]);
        }

        foreach ($wanted as $tag) {
            $this->itemTags->add(new BudgetItemTag($this, $tag));
        }

        return $this;
    }
}
