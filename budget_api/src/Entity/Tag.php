<?php

namespace App\Entity;

use App\Enum\Budget\ColorEnum;
use App\Repository\TagRepository;
use Doctrine\ORM\Mapping as ORM;
use InvalidArgumentException;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Uid\Uuid;

/**
 * Tag coloré façon Finder. Il appartient à un utilisateur OU à un board (tags d'un board partagé,
 * visibles par tous ses membres) : jamais aux deux, jamais à aucun.
 */
#[ORM\Entity(repositoryClass: TagRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_tag_user_color', columns: ['owner_user_id', 'color'])]
#[ORM\UniqueConstraint(name: 'uniq_tag_board_color', columns: ['owner_board_id', 'color'])]
class Tag
{
    /** Une couleur par tag : 13 couleurs, donc 13 tags au plus par propriétaire */
    public const MAX_PER_OWNER = 13;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['tag.read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_user_id', nullable: true, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(name: 'owner_board_id', nullable: true, onDelete: 'CASCADE')]
    private ?Board $ownerBoard = null;

    #[ORM\Column(length: 50)]
    #[Groups(['tag.read'])]
    private ?string $name = null;

    #[ORM\Column(length: 32, enumType: ColorEnum::class)]
    #[Groups(['tag.read'])]
    private ColorEnum $color = ColorEnum::Gray;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct(?User $owner = null, ?Board $ownerBoard = null)
    {
        if (($owner === null) === ($ownerBoard === null)) {
            throw new InvalidArgumentException('Un tag appartient soit à un utilisateur, soit à un board.');
        }

        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->owner = $owner;
        $this->ownerBoard = $ownerBoard;
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    /**
     * Propriétaire utilisateur (lu par OwnerVoter) ; null pour un tag de board.
     */
    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function getOwnerBoard(): ?Board
    {
        return $this->ownerBoard;
    }

    #[Groups(['tag.read'])]
    #[SerializedName('boardId')]
    public function getOwnerBoardId(): ?string
    {
        return $this->ownerBoard?->getId()?->toRfc4122();
    }

    #[Groups(['tag.read'])]
    public function getScope(): string
    {
        return $this->ownerBoard !== null ? 'board' : 'user';
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getColor(): ColorEnum
    {
        return $this->color;
    }

    public function setColor(ColorEnum $color): static
    {
        $this->color = $color;

        return $this;
    }

    #[Groups(['tag.read'])]
    #[SerializedName('hex')]
    public function getColorHex(): string
    {
        return $this->color->hex();
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
