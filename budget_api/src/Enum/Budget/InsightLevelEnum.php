<?php

namespace App\Enum\Budget;

enum InsightLevelEnum: string
{
    case Alert = 'alert';
    case Warning = 'warning';
    case Reminder = 'reminder';
    case Suggestion = 'suggestion';
    case Info = 'info';

    /**
     * Ordre d'affichage : du plus urgent au moins urgent.
     */
    public function weight(): int
    {
        return match ($this) {
            self::Alert => 0,
            self::Warning => 1,
            self::Reminder => 2,
            self::Suggestion => 3,
            self::Info => 4,
        };
    }
}
