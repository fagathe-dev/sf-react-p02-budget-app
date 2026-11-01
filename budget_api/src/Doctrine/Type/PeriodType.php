<?php

declare(strict_types=1);

namespace App\Doctrine\Type;

use App\ValueObject\Period;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\Exception\InvalidType;
use Doctrine\DBAL\Types\Exception\ValueNotConvertible;
use Doctrine\DBAL\Types\Type;
use Throwable;

/**
 * Colonne DATE au 1er du mois <-> Value Object Period (comparable et indexable en SQL).
 */
final class PeriodType extends Type
{
    public const NAME = 'period';

    public function getSQLDeclaration(array $column, AbstractPlatform $platform): string
    {
        return $platform->getDateTypeDeclarationSQL($column);
    }

    public function convertToDatabaseValue(mixed $value, AbstractPlatform $platform): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value) && Period::isValid($value)) {
            $value = Period::fromString($value);
        }

        if ($value instanceof Period) {
            return $value->getFirstDay()->format('Y-m-d');
        }

        throw InvalidType::new($value, self::NAME, ['null', 'string', Period::class]);
    }

    public function convertToPHPValue(mixed $value, AbstractPlatform $platform): ?Period
    {
        if ($value === null || $value instanceof Period) {
            return $value;
        }

        try {
            return $value instanceof \DateTimeInterface
                ? Period::fromDate($value)
                : Period::fromString((string) $value);
        } catch (Throwable $e) {
            throw ValueNotConvertible::new($value, self::NAME, null, $e);
        }
    }
}
