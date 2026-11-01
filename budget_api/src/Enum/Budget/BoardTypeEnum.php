<?php

namespace App\Enum\Budget;

/**
 * Types de board connus. La colonne Board.type reste un VARCHAR (ensemble ouvert) :
 * chaque type a son BoardTypeHandler, et ajouter un type (ex. "goal") ne touche pas la base.
 */
enum BoardTypeEnum: string
{
    case Personal = 'personal';
    case Shared = 'shared';
    case ExpenseGroup = 'expense_group';

    public function label(): string
    {
        return match ($this) {
            self::Personal => 'Budget personnel',
            self::Shared => 'Board partagé',
            self::ExpenseGroup => 'Groupe de dépenses',
        };
    }

    public static function labelOf(string $type): string
    {
        return self::tryFrom($type)?->label() ?? $type;
    }
}
