<?php

namespace App\Dto\Budget;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Modification d'un poste : le libellé, la position et les tags changent sur le poste ;
 * montant, récurrence, mode et payeur créent une révision à partir de effectiveFrom.
 */
final class ReviseItemDto
{
    #[Assert\NotBlank(message: 'Le libellé est obligatoire.')]
    #[Assert\Length(max: 120, maxMessage: 'Le libellé ne peut pas dépasser {{ limit }} caractères.')]
    public string $label = '';

    #[Assert\NotNull(message: 'Le montant est obligatoire.')]
    #[Assert\PositiveOrZero(message: 'Le montant ne peut pas être négatif.')]
    public ?int $amountCents = null;

    #[Assert\NotBlank(message: 'La récurrence est obligatoire.')]
    public string $recurrenceType = 'interval';

    /**
     * @var array<string, mixed>
     */
    public array $recurrenceParams = ['interval' => 1];

    #[Assert\NotBlank(message: 'Le mode de prise en compte est obligatoire.')]
    public string $allocation = 'on_due';

    /**
     * Mois à partir duquel la nouvelle règle s'applique (les mois passés restent justes).
     */
    #[Assert\NotBlank(message: 'Le mois d\'application est obligatoire.')]
    #[Assert\Regex(pattern: '/^\d{4}-(0[1-9]|1[0-2])$/', message: 'Le mois doit être au format AAAA-MM.')]
    public string $effectiveFrom = '';

    #[Assert\Regex(pattern: '/^\d{4}-(0[1-9]|1[0-2])$/', message: 'Le mois de fin doit être au format AAAA-MM.')]
    public ?string $endPeriod = null;

    #[Assert\Range(min: 1, max: 31, notInRangeMessage: 'Le jour de prélèvement doit être compris entre 1 et 31.')]
    public ?int $dueDay = null;

    #[Assert\Uuid(message: 'Identifiant de payeur invalide.')]
    public ?string $paidByMemberId = null;

    #[Assert\PositiveOrZero(message: 'La position ne peut pas être négative.')]
    public ?int $position = null;

    /**
     * null = tags inchangés ; [] = retirer tous les tags.
     *
     * @var list<string>|null
     */
    #[Assert\All(constraints: [new Assert\Uuid(message: 'Identifiant de tag invalide.')])]
    public ?array $tagIds = null;

    /**
     * null = répartition inchangée.
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
