<?php

namespace App\Entity;

use App\Repository\BudgetItemTagRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Liaison poste <-> tag (plusieurs tags par poste).
 */
#[ORM\Entity(repositoryClass: BudgetItemTagRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_budget_item_tag', columns: ['item_id', 'tag_id'])]
class BudgetItemTag
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        #[ORM\ManyToOne(targetEntity: BudgetItem::class, inversedBy: 'itemTags'), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private BudgetItem $item,
        #[ORM\ManyToOne(targetEntity: Tag::class), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private Tag $tag,
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

    public function getTag(): Tag
    {
        return $this->tag;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
