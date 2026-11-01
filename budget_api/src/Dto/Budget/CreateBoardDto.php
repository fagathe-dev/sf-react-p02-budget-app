<?php

namespace App\Dto\Budget;

use App\Enum\Budget\BoardTypeEnum;
use Symfony\Component\Validator\Constraints as Assert;

final class CreateBoardDto
{
    #[Assert\NotBlank(message: 'Le type de board est obligatoire.')]
    #[Assert\Choice(choices: [BoardTypeEnum::Personal->value, BoardTypeEnum::Shared->value], message: 'Type de board invalide.')]
    public string $type = BoardTypeEnum::Shared->value;

    #[Assert\NotBlank(message: 'Le nom du board est obligatoire.')]
    #[Assert\Length(max: 120, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.')]
    public string $name = '';

    // Pas d'Assert\Currency : il exige symfony/intl, absent du projet
    #[Assert\Regex(pattern: '/^[A-Z]{3}$/', message: 'La devise doit être un code ISO 4217 en majuscules (ex. EUR).')]
    public string $currency = 'EUR';

    /**
     * @var array<string, mixed>
     */
    public array $settings = [];

    /**
     * Prénoms d'invités locaux à ajouter dès la création (board partagé). Sans règle de répartition,
     * le board se partage à parts égales ; PUT /api/boards/{id}/split-rule pour la changer.
     *
     * @var list<string>
     */
    #[Assert\All(constraints: [
        new Assert\NotBlank(message: 'Le prénom d\'un membre est obligatoire.'),
        new Assert\Length(max: 80, maxMessage: 'Un prénom ne peut pas dépasser {{ limit }} caractères.'),
    ])]
    public array $guests = [];
}
