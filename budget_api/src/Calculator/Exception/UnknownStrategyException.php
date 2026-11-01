<?php

declare(strict_types=1);

namespace App\Calculator\Exception;

use LogicException;

/**
 * Un code stocké en base n'a pas de classe correspondante : erreur explicite plutôt qu'un 0 silencieux.
 */
final class UnknownStrategyException extends LogicException
{
    /**
     * @param list<string> $knownCodes
     */
    public static function for(string $kind, string $code, array $knownCodes): self
    {
        return new self(sprintf(
            'Code de %s inconnu : "%s". Codes disponibles : %s.',
            $kind,
            $code,
            $knownCodes !== [] ? implode(', ', $knownCodes) : 'aucun'
        ));
    }
}
