<?php

namespace App\Dto\Budget;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Exception du mois : « include » (compter), « exclude » (ne pas compter), « amount » (montant réel).
 */
final class SetAdjustmentDto
{
    #[Assert\NotBlank(message: 'Le type d\'exception est obligatoire.')]
    public string $type = '';

    public ?int $amountCents = null;

    /**
     * @var array<string, mixed>
     */
    public array $params = [];

    #[Assert\Length(max: 255, maxMessage: 'La note ne peut pas dépasser {{ limit }} caractères.')]
    public ?string $note = null;
}
