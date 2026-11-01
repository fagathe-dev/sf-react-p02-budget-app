<?php

declare(strict_types=1);

namespace App\BoardType;

use App\Entity\BoardMember;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\ItemKindEnum;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Budget d'une personne : revenus, charges perso, épargne, et cible des remontées.
 */
#[AsTaggedItem(self::CODE)]
final class PersonalBoardType implements BoardTypeHandlerInterface
{
    public const CODE = BoardTypeEnum::Personal->value;

    public function allowsItemKind(ItemKindEnum $kind): bool
    {
        return true;
    }

    public function acceptsMembers(): bool
    {
        return false;
    }

    public function onMemberJoined(BoardMember $member, Period $from): void {}

    public function onMemberLeft(BoardMember $member, Period $lastPeriod): void {}
}
