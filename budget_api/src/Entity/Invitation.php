<?php

namespace App\Entity;

use App\Enum\Budget\InvitationChannelEnum;
use App\Enum\Budget\InvitationStatusEnum;
use App\Repository\InvitationRepository;
use Doctrine\ORM\Mapping as ORM;
use LogicException;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Uid\Uuid;

/**
 * Invitation dans un board partagé ou un groupe de dépenses (les deux sont des Board).
 * Seul le hash SHA-256 du jeton est stocké : le jeton en clair n'existe que dans l'e-mail ou le lien.
 */
#[ORM\Entity(repositoryClass: InvitationRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_invitation_token_hash', columns: ['token_hash'])]
#[ORM\Index(name: 'idx_invitation_board_status', columns: ['board_id', 'status'])]
class Invitation
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['invitation.read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Board $board = null;

    /**
     * Le membre visé : un invité local existant, ou le membre créé pour l'invitation.
     */
    #[ORM\ManyToOne(targetEntity: BoardMember::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?BoardMember $member = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $invitedBy = null;

    #[ORM\Column(length: 180, nullable: true)]
    #[Groups(['invitation.read'])]
    private ?string $email = null;

    #[ORM\Column(length: 32, enumType: InvitationChannelEnum::class)]
    #[Groups(['invitation.read'])]
    private InvitationChannelEnum $channel = InvitationChannelEnum::Email;

    #[ORM\Column(length: 64)]
    private ?string $tokenHash = null;

    #[ORM\Column(length: 32, enumType: InvitationStatusEnum::class)]
    #[Groups(['invitation.read'])]
    private InvitationStatusEnum $status = InvitationStatusEnum::Pending;

    #[ORM\Column]
    #[Groups(['invitation.read'])]
    private ?\DateTimeImmutable $expiresAt = null;

    #[ORM\Column(options: ['default' => 1])]
    #[Groups(['invitation.read'])]
    private int $maxUses = 1;

    #[ORM\Column(options: ['default' => 0])]
    #[Groups(['invitation.read'])]
    private int $useCount = 0;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $acceptedBy = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['invitation.read'])]
    private ?\DateTimeImmutable $acceptedAt = null;

    #[ORM\Column]
    #[Groups(['invitation.read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
    }

    public static function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
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

    #[Groups(['invitation.read'])]
    #[SerializedName('boardId')]
    public function getBoardId(): ?string
    {
        return $this->board?->getId()?->toRfc4122();
    }

    public function getMember(): ?BoardMember
    {
        return $this->member;
    }

    public function setMember(BoardMember $member): static
    {
        $this->member = $member;

        return $this;
    }

    #[Groups(['invitation.read'])]
    #[SerializedName('memberId')]
    public function getMemberId(): ?string
    {
        return $this->member?->getId()?->toRfc4122();
    }

    public function getInvitedBy(): ?User
    {
        return $this->invitedBy;
    }

    public function setInvitedBy(?User $invitedBy): static
    {
        $this->invitedBy = $invitedBy;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email !== null ? strtolower(trim($email)) : null;

        return $this;
    }

    public function getChannel(): InvitationChannelEnum
    {
        return $this->channel;
    }

    public function setChannel(InvitationChannelEnum $channel): static
    {
        $this->channel = $channel;

        return $this;
    }

    public function getTokenHash(): ?string
    {
        return $this->tokenHash;
    }

    public function setTokenHash(string $tokenHash): static
    {
        $this->tokenHash = $tokenHash;

        return $this;
    }

    public function getStatus(): InvitationStatusEnum
    {
        return $this->status;
    }

    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }

    public function getMaxUses(): int
    {
        return $this->maxUses;
    }

    public function setMaxUses(int $maxUses): static
    {
        $this->maxUses = max(1, $maxUses);

        return $this;
    }

    public function getUseCount(): int
    {
        return $this->useCount;
    }

    public function getAcceptedBy(): ?User
    {
        return $this->acceptedBy;
    }

    public function getAcceptedAt(): ?\DateTimeImmutable
    {
        return $this->acceptedAt;
    }

    public function isExpired(\DateTimeImmutable $now): bool
    {
        return $this->expiresAt !== null && $this->expiresAt <= $now;
    }

    public function isUsable(\DateTimeImmutable $now): bool
    {
        return $this->status === InvitationStatusEnum::Pending
            && !$this->isExpired($now)
            && $this->useCount < $this->maxUses;
    }

    /**
     * Une utilisation de plus ; l'invitation passe à "accepted" quand ses usages sont épuisés.
     */
    public function accept(User $user, \DateTimeImmutable $now): static
    {
        if (!$this->isUsable($now)) {
            throw new LogicException('Cette invitation n\'est plus utilisable.');
        }

        $this->useCount++;
        $this->acceptedBy = $user;
        $this->acceptedAt = $now;

        if ($this->useCount >= $this->maxUses) {
            $this->status = InvitationStatusEnum::Accepted;
        }

        return $this;
    }

    public function revoke(): static
    {
        if ($this->status === InvitationStatusEnum::Pending) {
            $this->status = InvitationStatusEnum::Revoked;
        }

        return $this;
    }

    public function markExpired(): static
    {
        if ($this->status === InvitationStatusEnum::Pending) {
            $this->status = InvitationStatusEnum::Expired;
        }

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
}
