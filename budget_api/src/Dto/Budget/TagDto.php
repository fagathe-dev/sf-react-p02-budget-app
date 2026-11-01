<?php

namespace App\Dto\Budget;

use App\Enum\Budget\ColorEnum;
use Symfony\Component\Validator\Constraints as Assert;

final class TagDto
{
    #[Assert\NotBlank(message: 'Le nom du tag est obligatoire.')]
    #[Assert\Length(max: 50, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.')]
    public string $name = '';

    #[Assert\NotBlank(message: 'La couleur est obligatoire.')]
    #[Assert\Choice(callback: [ColorEnum::class, 'values'], message: 'Couleur invalide.')]
    public string $color = '';

    /**
     * Renseigné : tag du board partagé (visible par ses membres) ; vide : tag personnel.
     */
    #[Assert\Uuid(message: 'Identifiant de board invalide.')]
    public ?string $boardId = null;
}
