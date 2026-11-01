<?php

declare(strict_types=1);

namespace App\Insight;

use App\Enum\Budget\InsightLevelEnum;

/**
 * Un message de la page d'accueil : { key, level, message, link }.
 */
final readonly class Insight implements \JsonSerializable
{
    public function __construct(
        public string $key,
        public InsightLevelEnum $level,
        public string $message,
        public ?string $link = null,
        public int $amountCents = 0,
    ) {}

    /**
     * @return array{key: string, level: string, message: string, link: string|null, amountCents: int}
     */
    public function jsonSerialize(): array
    {
        return [
            'key'         => $this->key,
            'level'       => $this->level->value,
            'message'     => $this->message,
            'link'        => $this->link,
            'amountCents' => $this->amountCents,
        ];
    }
}
