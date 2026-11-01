<?php

declare(strict_types=1);

namespace App\Calculator\Link;

use App\Calculator\BoardCalculator;
use App\Calculator\Result\RollupResult;
use App\Entity\BoardLink;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Fait remonter un board source dans un board cible. Une implémentation par code de lien.
 * Le calculateur est passé en argument (et non injecté) : pas de dépendance circulaire.
 */
#[AutoconfigureTag]
interface BoardLinkHandlerInterface
{
    public function contribute(BoardLink $link, Period $period, BoardCalculator $calculator): ?RollupResult;
}
