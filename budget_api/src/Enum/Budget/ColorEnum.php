<?php

namespace App\Enum\Budget;

/**
 * Couleurs des tags façon Finder : une couleur par tag, 13 tags au plus par propriétaire.
 */
enum ColorEnum: string
{
    case Red = 'red';
    case Orange = 'orange';
    case Amber = 'amber';
    case Yellow = 'yellow';
    case Lime = 'lime';
    case Green = 'green';
    case Teal = 'teal';
    case Cyan = 'cyan';
    case Blue = 'blue';
    case Indigo = 'indigo';
    case Purple = 'purple';
    case Pink = 'pink';
    case Gray = 'gray';

    public function hex(): string
    {
        return match ($this) {
            self::Red => '#ef4444',
            self::Orange => '#f97316',
            self::Amber => '#f59e0b',
            self::Yellow => '#eab308',
            self::Lime => '#84cc16',
            self::Green => '#22c55e',
            self::Teal => '#14b8a6',
            self::Cyan => '#06b6d4',
            self::Blue => '#3b82f6',
            self::Indigo => '#6366f1',
            self::Purple => '#a855f7',
            self::Pink => '#ec4899',
            self::Gray => '#6b7280',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $color): string => $color->value, self::cases());
    }
}
