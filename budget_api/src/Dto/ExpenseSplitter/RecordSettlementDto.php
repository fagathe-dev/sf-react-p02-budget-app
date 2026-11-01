<?php

namespace App\Dto\ExpenseSplitter;

use Symfony\Component\Validator\Constraints as Assert;

final class RecordSettlementDto
{
    #[Assert\NotBlank(message: 'Le participant qui rembourse est obligatoire.')]
    #[Assert\Uuid(message: 'Identifiant de participant invalide.')]
    public string $fromMemberId = '';

    #[Assert\NotBlank(message: 'Le participant remboursé est obligatoire.')]
    #[Assert\Uuid(message: 'Identifiant de participant invalide.')]
    #[Assert\NotEqualTo(propertyPath: 'fromMemberId', message: 'Un participant ne peut pas se rembourser lui-même.')]
    public string $toMemberId = '';

    #[Assert\NotNull(message: 'Le montant est obligatoire.')]
    #[Assert\Positive(message: 'Le montant doit être positif.')]
    public ?int $amountCents = null;

    /**
     * Aujourd'hui par défaut.
     */
    #[Assert\Date(message: 'La date doit être au format AAAA-MM-JJ.')]
    public ?string $settledOn = null;

    #[Assert\Length(max: 255, maxMessage: 'La note ne peut pas dépasser {{ limit }} caractères.')]
    public ?string $note = null;
}
