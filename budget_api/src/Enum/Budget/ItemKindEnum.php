<?php

namespace App\Enum\Budget;

enum ItemKindEnum: string
{
    case Income = 'income';
    case Expense = 'expense';
    case Savings = 'savings';

    public function label(): string
    {
        return match ($this) {
            self::Income => 'Revenu',
            self::Expense => 'Dépense',
            self::Savings => 'Épargne',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $kind): string => $kind->value, self::cases());
    }
}
