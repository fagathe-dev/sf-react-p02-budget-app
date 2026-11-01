<?php

namespace App\Dto\Budget;

use App\Enum\Budget\MemberRoleEnum;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un simple prénom (invité local) ou l'e-mail d'un inscrit, qui recevra une invitation à accepter.
 */
final class AddMemberDto
{
    #[Assert\NotBlank(message: 'Le prénom du membre est obligatoire.')]
    #[Assert\Length(max: 80, maxMessage: 'Le prénom ne peut pas dépasser {{ limit }} caractères.')]
    public string $displayName = '';

    #[Assert\Email(message: 'L\'adresse e-mail est invalide.')]
    public ?string $email = null;

    #[Assert\Choice(choices: [MemberRoleEnum::Editor->value, MemberRoleEnum::Viewer->value], message: 'Rôle invalide.')]
    public string $role = MemberRoleEnum::Editor->value;
}
