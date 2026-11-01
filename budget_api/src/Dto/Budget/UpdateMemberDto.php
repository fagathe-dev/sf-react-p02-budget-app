<?php

namespace App\Dto\Budget;

use App\Enum\Budget\MemberRoleEnum;
use Symfony\Component\Validator\Constraints as Assert;

final class UpdateMemberDto
{
    #[Assert\Length(min: 1, max: 80, minMessage: 'Le prénom est obligatoire.', maxMessage: 'Le prénom ne peut pas dépasser {{ limit }} caractères.')]
    public ?string $displayName = null;

    #[Assert\Choice(choices: [MemberRoleEnum::Editor->value, MemberRoleEnum::Viewer->value], message: 'Rôle invalide.')]
    public ?string $role = null;

    /**
     * Nouvelle part du membre en points de base (7 000 = 70 %). Le reste est réparti entre les autres
     * membres au prorata de leur part actuelle, dans une nouvelle règle « percentage » du board.
     */
    #[Assert\Range(min: 0, max: 10000, notInRangeMessage: 'La part doit être comprise entre 0 et 100 %.')]
    public ?int $shareBasisPoints = null;

    #[Assert\Regex(pattern: '/^\d{4}-(0[1-9]|1[0-2])$/', message: 'Le mois doit être au format AAAA-MM.')]
    public ?string $effectiveFrom = null;
}
