<?php

namespace App\Dto\Budget;

use App\Enum\Budget\ItemKindEnum;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Nouveau poste : sa structure (quoi) et sa première révision (combien, quand, qui paie).
 */
final class CreateItemDto
{
    #[Assert\NotBlank(message: 'Le type de poste est obligatoire.')]
    #[Assert\Choice(callback: [ItemKindEnum::class, 'values'], message: 'Type de poste invalide (income, expense ou savings).')]
    public string $kind = 'expense';

    #[Assert\NotBlank(message: 'Le libellé est obligatoire.')]
    #[Assert\Length(max: 120, maxMessage: 'Le libellé ne peut pas dépasser {{ limit }} caractères.')]
    public string $label = '';

    #[Assert\NotNull(message: 'Le montant est obligatoire.')]
    #[Assert\PositiveOrZero(message: 'Le montant ne peut pas être négatif.')]
    public ?int $amountCents = null;

    #[Assert\NotBlank(message: 'La récurrence est obligatoire.')]
    public string $recurrenceType = 'interval';

    /**
     * Paramètres de la récurrence, validés par sa stratégie (ex. {"interval": 2, "anchor": "2026-01"}).
     *
     * @var array<string, mixed>
     */
    public array $recurrenceParams = ['interval' => 1];

    #[Assert\NotBlank(message: 'Le mode de prise en compte est obligatoire.')]
    public string $allocation = 'on_due';

    /**
     * Premier mois de validité (mois en cours par défaut).
     */
    #[Assert\Regex(pattern: '/^\d{4}-(0[1-9]|1[0-2])$/', message: 'Le mois doit être au format AAAA-MM.')]
    public ?string $effectiveFrom = null;

    #[Assert\Regex(pattern: '/^\d{4}-(0[1-9]|1[0-2])$/', message: 'Le mois de fin doit être au format AAAA-MM.')]
    public ?string $endPeriod = null;

    #[Assert\Range(min: 1, max: 31, notInRangeMessage: 'Le jour de prélèvement doit être compris entre 1 et 31.')]
    public ?int $dueDay = null;

    /**
     * Payeur : un membre du board, ou null pour le compte commun.
     */
    #[Assert\Uuid(message: 'Identifiant de payeur invalide.')]
    public ?string $paidByMemberId = null;

    #[Assert\PositiveOrZero(message: 'La position ne peut pas être négative.')]
    public ?int $position = null;

    /**
     * @var list<string>
     */
    #[Assert\All(constraints: [new Assert\Uuid(message: 'Identifiant de tag invalide.')])]
    public array $tagIds = [];

    /**
     * Répartition propre au poste (sinon celle du board).
     */
    public ?string $splitStrategy = null;

    /**
     * @var list<array{memberId: string, value?: int|null}>
     */
    #[Assert\All(constraints: [
        new Assert\Collection(fields: [
            'memberId' => [new Assert\NotBlank(message: 'Le membre est obligatoire.'), new Assert\Uuid(message: 'Identifiant de membre invalide.')],
            'value'    => new Assert\Optional([new Assert\Type(type: 'integer', message: 'La valeur doit être un nombre entier.')]),
        ]),
    ])]
    public array $splitEntries = [];
}
