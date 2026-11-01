<?php

declare(strict_types=1);

namespace App\BoardType;

use App\Entity\BoardMember;
use App\Enum\Budget\ItemKindEnum;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Comportement propre à un type de board (Board.type). Nouveau type (ex. "goal") = nouvelle classe taguée.
 */
#[AutoconfigureTag]
interface BoardTypeHandlerInterface
{
    public function allowsItemKind(ItemKindEnum $kind): bool;

    /**
     * Le board accepte-t-il d'autres membres que son propriétaire ?
     */
    public function acceptsMembers(): bool;

    /**
     * Un membre lié à un compte rejoint le board (création par le propriétaire ou invitation acceptée).
     */
    public function onMemberJoined(BoardMember $member, Period $from): void;

    public function onMemberLeft(BoardMember $member, Period $lastPeriod): void;
}
