<?php

namespace App\Enum\Budget;

enum InvitationChannelEnum: string
{
    case Email = 'email';
    case Link = 'link';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $channel): string => $channel->value, self::cases());
    }
}
