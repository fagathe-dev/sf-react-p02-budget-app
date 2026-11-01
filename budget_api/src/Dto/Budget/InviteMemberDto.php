<?php

namespace App\Dto\Budget;

use App\Enum\Budget\InvitationChannelEnum;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Invitation par e-mail ou lien partageable. memberId vise un invité local existant,
 * sinon un membre « invited » est créé avec displayName.
 */
final class InviteMemberDto
{
    #[Assert\Email(message: 'L\'adresse e-mail est invalide.')]
    public ?string $email = null;

    #[Assert\Uuid(message: 'Identifiant de membre invalide.')]
    public ?string $memberId = null;

    #[Assert\Length(max: 80, maxMessage: 'Le prénom ne peut pas dépasser {{ limit }} caractères.')]
    public ?string $displayName = null;

    #[Assert\Choice(callback: [InvitationChannelEnum::class, 'values'], message: 'Canal d\'invitation invalide (email ou link).')]
    public string $channel = 'email';

    #[Assert\Range(min: 1, max: 50, notInRangeMessage: 'Le nombre d\'utilisations doit être compris entre 1 et 50.')]
    public int $maxUses = 1;

    #[Assert\Range(min: 1, max: 30, notInRangeMessage: 'La validité doit être comprise entre 1 et 30 jours.')]
    public int $ttlDays = 7;
}
