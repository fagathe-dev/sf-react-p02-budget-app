<?php

namespace App\Dto\ExpenseSplitter;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Dépense réelle : payeur, montant, date, libellé, participants et mode de répartition.
 * En amount, value = centimes ; en percentage, value = points de base ; en equals, value est ignorée.
 */
final class AddExpenseDto
{
    #[Assert\NotBlank(message: 'Le payeur est obligatoire.')]
    #[Assert\Uuid(message: 'Identifiant de payeur invalide.')]
    public string $paidByMemberId = '';

    #[Assert\NotNull(message: 'Le montant est obligatoire.')]
    #[Assert\Positive(message: 'Le montant doit être positif.')]
    public ?int $amountCents = null;

    #[Assert\NotBlank(message: 'La date est obligatoire.')]
    #[Assert\Date(message: 'La date doit être au format AAAA-MM-JJ.')]
    public string $spentOn = '';

    #[Assert\NotBlank(message: 'Le libellé est obligatoire.')]
    #[Assert\Length(max: 120, maxMessage: 'Le libellé ne peut pas dépasser {{ limit }} caractères.')]
    public string $label = '';

    #[Assert\Uuid(message: 'Identifiant de tag invalide.')]
    public ?string $tagId = null;

    #[Assert\NotBlank(message: 'Le mode de répartition est obligatoire.')]
    public string $splitStrategy = 'equals';

    /**
     * @var list<array{memberId: string, value?: int|null}>
     */
    #[Assert\Count(min: 1, minMessage: 'Sélectionnez au moins un participant.')]
    #[Assert\All(constraints: [
        new Assert\Collection(fields: [
            'memberId' => [new Assert\NotBlank(message: 'Le participant est obligatoire.'), new Assert\Uuid(message: 'Identifiant de participant invalide.')],
            'value'    => new Assert\Optional([new Assert\Type(type: 'integer', message: 'La valeur doit être un nombre entier.')]),
        ]),
    ])]
    public array $participants = [];
}
