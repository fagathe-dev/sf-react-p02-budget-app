<?php

declare(strict_types=1);

namespace App\Calculator\Link;

use App\Calculator\BoardCalculator;
use App\Calculator\Result\RollupLine;
use App\Calculator\Result\RollupResult;
use App\Entity\BoardLink;
use App\Enum\Budget\ItemKindEnum;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * share_rollup : la part d'un membre dans un board partagé remonte dans son board perso.
 * Un board perso ne peut pas être source d'un lien : pas de cycle possible.
 */
#[AsTaggedItem(self::CODE)]
final class ShareRollupLink implements BoardLinkHandlerInterface
{
    public const CODE = 'share_rollup';

    public function contribute(BoardLink $link, Period $period, BoardCalculator $calculator): ?RollupResult
    {
        $source = $link->getSourceBoard();
        $member = $link->getMember();

        if ($source === null || $member === null || $source->isPersonal()) {
            return null;
        }

        $result = $calculator->calculate($source, $period);
        $memberId = (string) $member->getId();

        $lines = [];
        $expenseCents = 0;
        $savingsCents = 0;

        foreach ($result->lines as $line) {
            if (!$line->isActive) {
                continue;
            }

            $share = $line->shares[$memberId] ?? 0;
            $lines[] = new RollupLine(
                sourceItemId: $line->itemId,
                kind: $line->kind,
                label: $line->label,
                amountCents: $share,
                householdAmountCents: $line->amountCents,
                isDue: $line->isDue,
                isMonthly: $line->isMonthly,
                isVariable: $line->isVariable,
                allocation: $line->allocation,
                dueDay: $line->dueDay,
                hasAdjustment: $line->adjustmentType !== null,
                tags: $line->tags,
            );

            match ($line->kind) {
                ItemKindEnum::Savings->value => $savingsCents += $share,
                ItemKindEnum::Expense->value => $expenseCents += $share,
                default => null, // revenus réservés au board perso en V1
            };
        }

        return new RollupResult(
            linkId: (string) $link->getId(),
            type: self::CODE,
            sourceBoardId: $result->boardId,
            sourceBoardName: $result->name,
            memberId: $memberId,
            expenseCents: $expenseCents,
            savingsCents: $savingsCents,
            contributionCents: $result->balance['contributions'][$memberId] ?? null,
            balanceCents: $result->balance['balances'][$memberId] ?? null,
            lines: $lines,
        );
    }
}
