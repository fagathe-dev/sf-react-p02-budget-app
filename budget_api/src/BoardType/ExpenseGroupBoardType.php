<?php

declare(strict_types=1);

namespace App\BoardType;

use App\Entity\BoardMember;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\ItemKindEnum;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Groupe de dépenses (ExpenseSplitter) : des dépenses réelles, pas de postes budgétaires.
 * La remontée dans le budget perso (expense_rollup) viendra au lot 3.
 */
#[AsTaggedItem(self::CODE)]
final class ExpenseGroupBoardType implements BoardTypeHandlerInterface
{
    public const CODE = BoardTypeEnum::ExpenseGroup->value;

    public function allowsItemKind(ItemKindEnum $kind): bool
    {
        return false;
    }

    public function acceptsMembers(): bool
    {
        return true;
    }

    public function onMemberJoined(BoardMember $member, Period $from): void {}

    public function onMemberLeft(BoardMember $member, Period $lastPeriod): void {}
}
