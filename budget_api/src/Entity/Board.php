<?php

namespace App\Entity;

use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\MemberStatusEnum;
use App\Repository\BoardRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

/**
 * Un board : budget perso, board partagé d'un foyer ou groupe de dépenses.
 * Le type est un code ouvert (VARCHAR), interprété par son BoardTypeHandler.
 */
#[ORM\Entity(repositoryClass: BoardRepository::class)]
#[ORM\Index(name: 'idx_board_owner_type', columns: ['owner_id', 'type'])]
class Board
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['board.read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column(length: 32)]
    #[Groups(['board.read'])]
    private string $type = BoardTypeEnum::Personal->value;

    #[ORM\Column(length: 120)]
    #[Groups(['board.read'])]
    private ?string $name = null;

    #[ORM\Column(length: 3, options: ['fixed' => true])]
    #[Groups(['board.read'])]
    private string $currency = 'EUR';

    /**
     * Préférences d'affichage (ex. rollupDisplay : grouped | detailed).
     *
     * @var array<string, mixed>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['board.read'])]
    private array $settings = [];

    #[ORM\Column]
    #[Groups(['board.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['board.read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['board.read'])]
    private ?\DateTimeImmutable $archivedAt = null;

    /**
     * @var Collection<int, BoardMember>
     */
    #[ORM\OneToMany(targetEntity: BoardMember::class, mappedBy: 'board', cascade: ['persist'])]
    #[ORM\OrderBy(['createdAt' => 'ASC', 'id' => 'ASC'])] // UUID v7 : départage à la milliseconde
    private Collection $members;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->members = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function isPersonal(): bool
    {
        return $this->type === BoardTypeEnum::Personal->value;
    }

    public function isExpenseGroup(): bool
    {
        return $this->type === BoardTypeEnum::ExpenseGroup->value;
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

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = strtoupper($currency);

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function getSettings(): array
    {
        return $this->settings;
    }

    /**
     * @param array<string, mixed> $settings
     */
    public function setSettings(array $settings): static
    {
        $this->settings = $settings;

        return $this;
    }

    public function getSetting(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $default;
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
     * @return Collection<int, BoardMember>
     */
    public function getMembers(): Collection
    {
        return $this->members;
    }

    public function addMember(BoardMember $member): static
    {
        if (!$this->members->contains($member)) {
            $this->members->add($member);
        }

        return $this;
    }

    public function findMember(Uuid|string $memberId): ?BoardMember
    {
        foreach ($this->members as $member) {
            if ((string) $member->getId() === (string) $memberId) {
                return $member;
            }
        }

        return null;
    }

    /**
     * Le membre lié à ce compte, quel que soit son statut.
     */
    public function findMemberForUser(User $user): ?BoardMember
    {
        foreach ($this->members as $member) {
            if ($member->getUser() !== null && (string) $member->getUser()->getId() === (string) $user->getId()) {
                return $member;
            }
        }

        return null;
    }

    /**
     * Membres qui reçoivent une part (actifs et invités), dans l'ordre de création :
     * cet ordre départage les centimes d'arrondi.
     *
     * @return list<BoardMember>
     */
    public function getSplittableMembers(): array
    {
        return array_values($this->members->filter(
            static fn (BoardMember $member): bool => $member->getStatus() !== MemberStatusEnum::Left
        )->toArray());
    }
}
