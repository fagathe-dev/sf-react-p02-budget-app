<?php

namespace App\Entity;

use App\Doctrine\Type\PeriodType;
use App\Entity\Embeddable\Money;
use App\Repository\BudgetItemRevisionRepository;
use App\ValueObject\Period;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Règle datée d'un poste : combien, quand et qui paie, à partir de effectiveFrom.
 * Immuable : une correction crée une nouvelle révision (seule celle du même mois peut être remplacée).
 */
#[ORM\Entity(repositoryClass: BudgetItemRevisionRepository::class, readOnly: true)]
#[ORM\UniqueConstraint(name: 'uniq_revision_item_period', columns: ['item_id', 'effective_from'])]
class BudgetItemRevision
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    /**
     * @param array<string, mixed> $recurrenceParams ex. ['interval' => 2, 'anchor' => '2026-01']
     */
    public function __construct(
        #[ORM\ManyToOne(targetEntity: BudgetItem::class, inversedBy: 'revisions'), ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private BudgetItem $item,
        #[ORM\Column(type: PeriodType::NAME)]
        private Period $effectiveFrom,
        #[ORM\Embedded(class: Money::class, columnPrefix: false)]
        private Money $amount,
        #[ORM\Column(length: 32)]
        private string $recurrenceType,          // code ouvert : 'interval', 'specific_months', 'one_off'…
        #[ORM\Column(type: Types::JSON)]
        private array $recurrenceParams,
        #[ORM\Column(length: 32)]
        private string $allocation,              // code ouvert : 'on_due', 'smoothed'
        #[ORM\Column(type: PeriodType::NAME, nullable: true)]
        private ?Period $endPeriod = null,
        #[ORM\Column(type: Types::SMALLINT, nullable: true)]
        private ?int $dueDay = null,
        #[ORM\ManyToOne(targetEntity: BoardMember::class), ORM\JoinColumn(name: 'paid_by_member_id', nullable: true, onDelete: 'SET NULL')]
        private ?BoardMember $paidBy = null,     // null = compte commun (ou compte perso pour un board perso)
        #[ORM\ManyToOne(targetEntity: User::class), ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?User $createdBy = null,
    ) {
        // Pas d'ajout à $item->revisions ici : BudgetItemRevisionRepository::replace() le fait
        // après avoir supprimé la révision du même mois (contrainte unique [item_id, effective_from]).
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
    }

    // Uniquement des getters : une correction crée une nouvelle révision.

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getItem(): BudgetItem
    {
        return $this->item;
    }

    public function getEffectiveFrom(): Period
    {
        return $this->effectiveFrom;
    }

    public function getAmount(): Money
    {
        return $this->amount;
    }

    public function getRecurrenceType(): string
    {
        return $this->recurrenceType;
    }

    /**
     * @return array<string, mixed>
     */
    public function getRecurrenceParams(): array
    {
        return $this->recurrenceParams;
    }

    public function getRecurrenceParam(string $key, mixed $default = null): mixed
    {
        return $this->recurrenceParams[$key] ?? $default;
    }

    public function getAllocation(): string
    {
        return $this->allocation;
    }

    public function getEndPeriod(): ?Period
    {
        return $this->endPeriod;
    }

    public function getDueDay(): ?int
    {
        return $this->dueDay;
    }

    public function getPaidBy(): ?BoardMember
    {
        return $this->paidBy;
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
     * Le poste compte-t-il en $period (entre effectiveFrom et endPeriod inclus) ?
     */
    public function covers(Period $period): bool
    {
        return !$period->isBefore($this->effectiveFrom)
            && ($this->endPeriod === null || !$period->isAfter($this->endPeriod));
    }

    /**
     * Facture variable (électricité…) : son montant réel est attendu en exception du mois.
     */
    public function isVariable(): bool
    {
        return (bool) ($this->recurrenceParams['variable'] ?? false);
    }

    /**
     * Instantané pour le journal (avant / après).
     *
     * @return array<string, mixed>
     */
    public function toSnapshot(): array
    {
        return [
            'effectiveFrom'    => $this->effectiveFrom->toString(),
            'endPeriod'        => $this->endPeriod?->toString(),
            'amountCents'      => $this->amount->getAmountCents(),
            'currency'         => $this->amount->getCurrency(),
            'recurrenceType'   => $this->recurrenceType,
            'recurrenceParams' => $this->recurrenceParams,
            'allocation'       => $this->allocation,
            'dueDay'           => $this->dueDay,
            'paidByMemberId'   => $this->paidBy?->getId()?->toRfc4122(),
        ];
    }
}
