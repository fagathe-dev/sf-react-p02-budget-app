<?php

namespace App\Entity;

use App\Repository\SplitRuleEntryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SplitRuleEntryRepository::class, readOnly: true)]
#[ORM\UniqueConstraint(name: 'uniq_split_entry_member', columns: ['split_rule_id', 'member_id'])]
class SplitRuleEntry
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    public function __construct(
        #[ORM\ManyToOne(targetEntity: SplitRule::class, inversedBy: 'entries'), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private SplitRule $splitRule,
        #[ORM\ManyToOne(targetEntity: BoardMember::class), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private BoardMember $member,
        #[ORM\Column(type: Types::BIGINT, nullable: true)]
        private ?int $value = null,              // vide (equals), centimes (amount), points de base (percentage)
    ) {
        $this->id = Uuid::v7();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getSplitRule(): SplitRule
    {
        return $this->splitRule;
    }

    public function getMember(): BoardMember
    {
        return $this->member;
    }

    public function getValue(): ?int
    {
        return $this->value;
    }
}
