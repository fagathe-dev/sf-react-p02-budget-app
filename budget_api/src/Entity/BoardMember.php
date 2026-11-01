<?php

namespace App\Entity;

use App\Enum\Budget\MemberRoleEnum;
use App\Enum\Budget\MemberStatusEnum;
use App\Repository\BoardMemberRepository;
use Doctrine\ORM\Mapping as ORM;
use LogicException;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Uid\Uuid;

/**
 * Une personne d'un board : un compte de l'appli, ou un simple prénom (invité local, user = null).
 */
#[ORM\Entity(repositoryClass: BoardMemberRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_board_member_user', columns: ['board_id', 'user_id'])]
class BoardMember
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['member.read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class, inversedBy: 'members')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Board $board = null;

    /**
     * À la suppression du compte, le membre redevient un invité local : le board des autres est conservé.
     */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    #[ORM\Column(length: 80)]
    #[Groups(['member.read'])]
    private ?string $displayName = null;

    #[ORM\Column(length: 32, enumType: MemberRoleEnum::class)]
    #[Groups(['member.read'])]
    private MemberRoleEnum $role = MemberRoleEnum::Editor;

    #[ORM\Column(length: 32, enumType: MemberStatusEnum::class)]
    #[Groups(['member.read'])]
    private MemberStatusEnum $status = MemberStatusEnum::Active;

    #[ORM\Column(nullable: true)]
    #[Groups(['member.read'])]
    private ?\DateTimeImmutable $joinedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['member.read'])]
    private ?\DateTimeImmutable $leftAt = null;

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

    public function getBoard(): ?Board
    {
        return $this->board;
    }

    public function setBoard(Board $board): static
    {
        $this->board = $board;
        $board->addMember($this);

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    #[Groups(['member.read'])]
    #[SerializedName('userId')]
    public function getUserId(): ?string
    {
        return $this->user?->getId()?->toRfc4122();
    }

    #[Groups(['member.read'])]
    #[SerializedName('isLinked')]
    public function isLinked(): bool
    {
        return $this->user !== null;
    }

    public function attachUser(User $user): static
    {
        if ($this->user !== null && (string) $this->user->getId() !== (string) $user->getId()) {
            throw new LogicException('Ce membre est déjà lié à un autre compte.');
        }

        $this->user = $user;

        return $this;
    }

    /**
     * Conversion en invité local (suppression du compte) : l'historique du board reste intact.
     */
    public function detachUser(): static
    {
        $this->user = null;

        if ($this->status === MemberStatusEnum::Invited) {
            $this->status = MemberStatusEnum::Active;
        }

        return $this;
    }

    public function getDisplayName(): ?string
    {
        return $this->displayName;
    }

    public function setDisplayName(string $displayName): static
    {
        $this->displayName = $displayName;

        return $this;
    }

    public function getRole(): MemberRoleEnum
    {
        return $this->role;
    }

    public function setRole(MemberRoleEnum $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function isOwner(): bool
    {
        return $this->role === MemberRoleEnum::Owner;
    }

    public function getStatus(): MemberStatusEnum
    {
        return $this->status;
    }

    /**
     * Membre en attente d'une invitation : il se comporte comme un invité local jusqu'à l'acceptation.
     */
    public function markInvited(): static
    {
        if ($this->status === MemberStatusEnum::Left) {
            throw new LogicException('Un membre parti ne peut pas être réinvité.');
        }

        $this->status = MemberStatusEnum::Invited;

        return $this;
    }

    /**
     * Transition invited -> active (ou création directe d'un membre actif).
     */
    public function activate(\DateTimeImmutable $now): static
    {
        if ($this->status === MemberStatusEnum::Left) {
            throw new LogicException('Un membre parti ne peut pas être réactivé.');
        }

        $this->status = MemberStatusEnum::Active;
        $this->joinedAt ??= $now;

        return $this;
    }

    /**
     * Transition invited|active -> left.
     */
    public function leave(\DateTimeImmutable $now): static
    {
        if ($this->status === MemberStatusEnum::Left) {
            throw new LogicException('Ce membre a déjà quitté le board.');
        }

        $this->status = MemberStatusEnum::Left;
        $this->leftAt = $now;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->status === MemberStatusEnum::Active;
    }

    public function isInvited(): bool
    {
        return $this->status === MemberStatusEnum::Invited;
    }

    public function isLeft(): bool
    {
        return $this->status === MemberStatusEnum::Left;
    }

    public function getJoinedAt(): ?\DateTimeImmutable
    {
        return $this->joinedAt;
    }

    public function getLeftAt(): ?\DateTimeImmutable
    {
        return $this->leftAt;
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
