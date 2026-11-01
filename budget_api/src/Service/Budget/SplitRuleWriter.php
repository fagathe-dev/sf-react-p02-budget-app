<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\Split\EqualsSplit;
use App\Calculator\StrategyRegistry;
use App\Entity\Board;
use App\Entity\BudgetItem;
use App\Entity\SplitRule;
use App\Entity\User;
use App\Repository\SplitRuleRepository;
use App\ValueObject\Period;

/**
 * Valide puis écrit une règle de répartition datée (du board ou d'un poste).
 * Une règle du même mois est remplacée ; les mois précédents gardent leur règle.
 */
final readonly class SplitRuleWriter
{
    public function __construct(
        private StrategyRegistry $registry,
        private SplitRuleRepository $repository,
    ) {}

    /**
     * @param list<array{memberId: string, value?: int|null}> $entries
     *
     * @return array<string, string> champ => message (vide si valide)
     */
    public function validate(Board $board, string $strategy, array $entries, string $field = 'entries'): array
    {
        if (!in_array($strategy, $this->registry->codes('split'), true)) {
            return ['splitStrategy' => sprintf('Mode de répartition inconnu (%s).', implode(', ', $this->registry->codes('split')))];
        }

        $values = [];
        foreach ($entries as $entry) {
            $member = $board->findMember($entry['memberId']);

            if ($member === null || $member->isLeft()) {
                return [$field => 'Chaque membre doit faire partie du board.'];
            }

            if (array_key_exists((string) $member->getId(), $values)) {
                return [$field => 'Un membre ne peut apparaître qu\'une fois.'];
            }

            $values[(string) $member->getId()] = $entry['value'] ?? null;
        }

        if ($values === []) {
            return $strategy === EqualsSplit::CODE ? [] : [$field => 'Indiquez la part de chaque membre.'];
        }

        $errors = $this->registry->split($strategy)->validate(null, $values);

        return $errors === [] ? [] : [$field => (string) reset($errors)];
    }

    /**
     * @param list<array{memberId: string, value?: int|null}> $entries entrées déjà validées
     */
    public function write(Board $board, ?BudgetItem $item, Period $from, string $strategy, array $entries, ?User $author): SplitRule
    {
        $rule = new SplitRule($board, $from, $strategy, $item, $author);

        foreach ($entries as $entry) {
            $rule->addEntry($board->findMember($entry['memberId']), $entry['value'] ?? null);
        }

        $this->repository->replace($this->repository->findStartingAt($board, $item, $from), $rule);

        return $rule;
    }
}
