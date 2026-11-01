<?php

namespace App\Dto\ExpenseSplitter;

use Symfony\Component\Validator\Constraints as Assert;

final class CreateExpenseGroupDto
{
    #[Assert\NotBlank(message: 'Le nom du groupe est obligatoire.')]
    #[Assert\Length(max: 120, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.')]
    public string $name = '';

    // Pas d'Assert\Currency : il exige symfony/intl, absent du projet
    #[Assert\Regex(pattern: '/^[A-Z]{3}$/', message: 'La devise doit être un code ISO 4217 en majuscules (ex. EUR).')]
    public string $currency = 'EUR';

    /**
     * Prénoms des autres participants (invités locaux) ; ils pourront être invités plus tard.
     *
     * @var list<string>
     */
    #[Assert\All(constraints: [
        new Assert\NotBlank(message: 'Le prénom d\'un participant est obligatoire.'),
        new Assert\Length(max: 80, maxMessage: 'Un prénom ne peut pas dépasser {{ limit }} caractères.'),
    ])]
    public array $participants = [];
}
