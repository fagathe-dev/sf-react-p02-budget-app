<?php

namespace App\Dto\Budget;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Règle de répartition du board, valable à partir d'un mois.
 */
final class SplitRuleDto
{
    #[Assert\NotBlank(message: 'Le mode de répartition est obligatoire.')]
    public string $strategy = 'equals';

    #[Assert\Regex(pattern: '/^\d{4}-(0[1-9]|1[0-2])$/', message: 'Le mois doit être au format AAAA-MM.')]
    public ?string $effectiveFrom = null;

    /**
     * Vide en equals = tous les membres ; sinon une valeur par membre (centimes ou points de base).
     *
     * @var list<array{memberId: string, value?: int|null}>
     */
    #[Assert\All(constraints: [
        new Assert\Collection(fields: [
            'memberId' => [new Assert\NotBlank(message: 'Le membre est obligatoire.'), new Assert\Uuid(message: 'Identifiant de membre invalide.')],
            'value'    => new Assert\Optional([new Assert\Type(type: 'integer', message: 'La valeur doit être un nombre entier.')]),
        ]),
    ])]
    public array $entries = [];
}
