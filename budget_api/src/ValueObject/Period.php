<?php

declare(strict_types=1);

namespace App\ValueObject;

use InvalidArgumentException;

/**
 * Un mois calendaire, toujours ramené au 1er jour du mois (type DBAL "period").
 * Impossible de stocker un « 15 du mois » par erreur.
 */
final class Period implements \Stringable, \JsonSerializable
{
    private const FORMAT = 'Y-m';
    private const PATTERN = '/^(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?$/';

    private function __construct(private readonly \DateTimeImmutable $firstDay) {}

    /**
     * Accepte "AAAA-MM" ou une date "AAAA-MM-JJ" (le jour est ignoré).
     */
    public static function fromString(string $value): self
    {
        if (!preg_match(self::PATTERN, $value, $matches)) {
            throw new InvalidArgumentException(sprintf('Période invalide : "%s" (format attendu AAAA-MM).', $value));
        }

        return new self(new \DateTimeImmutable(sprintf('%s-%s-01 00:00:00', $matches[1], $matches[2])));
    }

    public static function isValid(?string $value): bool
    {
        return $value !== null && preg_match(self::PATTERN, $value) === 1;
    }

    public static function fromDate(\DateTimeInterface $date): self
    {
        return self::fromString($date->format(self::FORMAT));
    }

    public static function current(): self
    {
        return self::fromDate(new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris')));
    }

    public function getFirstDay(): \DateTimeImmutable
    {
        return $this->firstDay;
    }

    public function getYear(): int
    {
        return (int) $this->firstDay->format('Y');
    }

    public function getMonth(): int
    {
        return (int) $this->firstDay->format('n');
    }

    public function plus(int $months): self
    {
        // Le 1er du mois ne déborde jamais, contrairement au 31
        return new self($this->firstDay->modify(sprintf('%+d months', $months)));
    }

    public function next(): self
    {
        return $this->plus(1);
    }

    public function previous(): self
    {
        return $this->plus(-1);
    }

    /**
     * Nombre de mois écoulés depuis $other (négatif si $other est après).
     */
    public function monthsSince(self $other): int
    {
        return ($this->getYear() - $other->getYear()) * 12 + ($this->getMonth() - $other->getMonth());
    }

    public function compareTo(self $other): int
    {
        return $this->monthsSince($other) <=> 0;
    }

    public function equals(self $other): bool
    {
        return $this->monthsSince($other) === 0;
    }

    public function isBefore(self $other): bool
    {
        return $this->monthsSince($other) < 0;
    }

    public function isAfter(self $other): bool
    {
        return $this->monthsSince($other) > 0;
    }

    public function toString(): string
    {
        return $this->firstDay->format(self::FORMAT);
    }

    public function __toString(): string
    {
        return $this->toString();
    }

    public function jsonSerialize(): string
    {
        return $this->toString();
    }
}
