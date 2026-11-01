<?php

namespace App\Security\Voter;

use App\Entity\Board;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Droits sur un board : un membre ne voit que ses boards, les membres liés modifient les postes,
 * seul le propriétaire gère les membres et supprime le board.
 * Attributs préfixés pour ne pas croiser OwnerVoter (VIEW, EDIT…), qui ne connaît que le propriétaire.
 *
 * @extends Voter<string, Board>
 */
final class BoardVoter extends Voter
{
    public const VIEW = 'BOARD_VIEW';
    public const EDIT = 'BOARD_EDIT';
    public const MANAGE_MEMBERS = 'BOARD_MANAGE_MEMBERS';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::MANAGE_MEMBERS], true)
            && $subject instanceof Board;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User || !$subject instanceof Board || ($subject->isArchived() && $attribute !== self::VIEW)) {
            return false;
        }

        if ((string) $subject->getOwner()?->getId() === (string) $user->getId()) {
            return true;
        }

        $member = $subject->findMemberForUser($user);
        if ($member === null || !$member->isActive()) {
            return false;
        }

        return match ($attribute) {
            self::VIEW => true,
            self::EDIT => $member->getRole()->canEdit(),
            default => false,
        };
    }
}
