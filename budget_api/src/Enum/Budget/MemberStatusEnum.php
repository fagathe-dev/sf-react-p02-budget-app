<?php

namespace App\Enum\Budget;

/**
 * Cycle de vie d'un membre : invited -> active -> left (transitions gardées par BoardMember).
 */
enum MemberStatusEnum: string
{
    case Invited = 'invited';
    case Active = 'active';
    case Left = 'left';
}
