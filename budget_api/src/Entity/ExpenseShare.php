<?php

namespace App\Entity;

use App\Repository\ExpenseShareRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Uid\Uuid;

/**
 * Part d'un participant dans une dépense, dans la devise de la dépense. Somme des parts = montant.
 */
#[ORM\Entity(repositoryClass: ExpenseShareRepository::class, readOnly: true)]
#[ORM\UniqueConstraint(name: 'uniq_expense_share_member', columns: ['expense_id', 'member_id'])]
class ExpenseShare
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    public function __construct(
        #[ORM\ManyToOne(targetEntity: Expense::class, inversedBy: 'shares'), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private Expense $expense,
        #[ORM\ManyToOne(targetEntity: BoardMember::class), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private BoardMember $member,
        #[ORM\Column(type: Types::BIGINT)]
        #[Groups(['expense.read'])]
        private int $amountCents,
        #[ORM\Column(type: Types::BIGINT, nullable: true)]
        #[Groups(['expense.read'])]
        private ?int $inputValue = null,         // saisie : centimes (amount), points de base (percentage), vide (equals)
    ) {
        $this->id = Uuid::v7();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getExpense(): Expense
    {
        return $this->expense;
    }

    public function getMember(): BoardMember
    {
        return $this->member;
    }

    #[Groups(['expense.read'])]
    #[SerializedName('memberId')]
    public function getMemberId(): string
    {
        return $this->member->getId()->toRfc4122();
    }

    public function getAmountCents(): int
    {
        return $this->amountCents;
    }

    public function getInputValue(): ?int
    {
        return $this->inputValue;
    }
}
