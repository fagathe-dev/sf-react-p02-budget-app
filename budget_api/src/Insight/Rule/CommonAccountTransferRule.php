<?php

declare(strict_types=1);

namespace App\Insight\Rule;

use App\Entity\Embeddable\Money;
use App\Enum\Budget\InsightLevelEnum;
use App\Insight\Insight;
use App\Insight\InsightContext;
use App\Insight\InsightRuleInterface;

/**
 * Rappel du versement au compte commun à faire en début de mois, board partagé par board partagé.
 */
final class CommonAccountTransferRule implements InsightRuleInterface
{
    public function supports(InsightContext $context): bool
    {
        return $context->sharedBoards !== [];
    }

    public function evaluate(InsightContext $context): array
    {
        $insights = [];

        foreach ($context->sharedBoards as $board) {
            $memberId = $context->memberIdIn($board);
            $contribution = $memberId !== null ? (int) ($board->balance['contributions'][$memberId] ?? 0) : 0;

            if ($contribution <= 0) {
                continue;
            }

            $insights[] = new Insight(
                key: sprintf('common_account_transfer:%s', $board->boardId),
                level: InsightLevelEnum::Reminder,
                message: sprintf('Versement de %s à faire sur le compte commun « %s ».', Money::formatCents($contribution, $board->currency), $board->name),
                link: sprintf('/boards/%s?month=%s', $board->boardId, $context->period),
                amountCents: $contribution,
            );
        }

        return $insights;
    }
}
