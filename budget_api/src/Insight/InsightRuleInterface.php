<?php

declare(strict_types=1);

namespace App\Insight;

use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * Une règle de la page d'accueil. Ajouter un insight = créer une classe, sans modifier InsightService.
 */
#[AutoconfigureTag]
interface InsightRuleInterface
{
    public function supports(InsightContext $context): bool;

    /**
     * @return list<Insight>
     */
    public function evaluate(InsightContext $context): array;
}
