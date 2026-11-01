<?php

namespace App\Entity\Embeddable;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use InvalidArgumentException;

/**
 * Montant en centimes avec sa devise : aucun float dans l'application.
 * Colonnes "amount_cents" (BIGINT) et "currency" (CHAR(3)) avec columnPrefix: false.
 */
#[ORM\Embeddable]
final class Money implements \JsonSerializable
{
    #[ORM\Column(type: Types::BIGINT)]
    private int $amountCents;

    #[ORM\Column(length: 3, options: ['fixed' => true])]
    private string $currency;

    public function __construct(int $amountCents, string $currency)
    {
        if (!preg_match('/^[A-Z]{3}$/', $currency)) {
            throw new InvalidArgumentException(sprintf('Devise invalide : "%s".', $currency));
        }

        $this->amountCents = $amountCents;
        $this->currency = $currency;
    }

    public static function of(int $amountCents, string $currency): self
    {
        return new self($amountCents, $currency);
    }

    public static function zero(string $currency): self
    {
        return new self(0, $currency);
    }

    public function getAmountCents(): int
    {
        return $this->amountCents;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function withAmount(int $amountCents): self
    {
        return new self($amountCents, $this->currency);
    }

    public function add(self $other): self
    {
        $this->assertSameCurrency($other);

        return new self($this->amountCents + $other->amountCents, $this->currency);
    }

    public function subtract(self $other): self
    {
        $this->assertSameCurrency($other);

        return new self($this->amountCents - $other->amountCents, $this->currency);
    }

    public function isZero(): bool
    {
        return $this->amountCents === 0;
    }

    public function isPositive(): bool
    {
        return $this->amountCents > 0;
    }

    public function isNegative(): bool
    {
        return $this->amountCents < 0;
    }

    /**
     * Format d'affichage français : 1 397,20 €
     */
    public function format(): string
    {
        return self::formatCents($this->amountCents, $this->currency);
    }

    public static function formatCents(int $amountCents, string $currency = 'EUR'): string
    {
        $symbol = match ($currency) {
            'EUR' => '€',
            'USD' => '$',
            'GBP' => '£',
            'CHF' => 'CHF',
            default => $currency,
        };

        return sprintf('%s %s', number_format($amountCents / 100, 2, ',', "\u{202F}"), $symbol);
    }

    /**
     * @return array{amountCents: int, currency: string}
     */
    public function jsonSerialize(): array
    {
        return ['amountCents' => $this->amountCents, 'currency' => $this->currency];
    }

    private function assertSameCurrency(self $other): void
    {
        if ($other->currency !== $this->currency) {
            throw new InvalidArgumentException(sprintf('Devises différentes : %s et %s.', $this->currency, $other->currency));
        }
    }
}
