<?php

declare(strict_types=1);

namespace App\Service\ExpenseSplitter;

use App\Calculator\BalanceCalculator;
use App\Entity\Board;
use App\Entity\BoardMember;
use App\Enum\Budget\BoardTypeEnum;
use App\Repository\BoardRepository;
use App\Repository\ExpenseRepository;
use App\Repository\SettlementRepository;
use App\Security\Voter\BoardVoter;
use App\Service\Budget\BudgetServiceTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Throwable;

/**
 * « Qui doit combien à qui » : soldes agrégés en SQL (dépenses annulées exclues) puis plan de virements.
 */
final class BalanceService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly ExpenseRepository $expenseRepository,
        private readonly SettlementRepository $settlementRepository,
        private readonly BalanceCalculator $balanceCalculator,
    ) {}

    /**
     * GET /api/expense-groups/{id}/balances
     */
    public function getBalances(string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::VIEW, BoardTypeEnum::ExpenseGroup->value);
        if (!$group instanceof Board) {
            return $group;
        }

        try {
            return $this->sendJson($this->compute($group));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du calcul des soldes.', 'expense_group.balances.error', $e, ['group_id' => $groupId]);
        }
    }

    /**
     * Solde = payé - parts + remboursements envoyés - remboursements reçus ; la somme des soldes vaut 0.
     *
     * @return array{totalSpentCents: int, balances: list<array<string, mixed>>, transfers: list<array<string, mixed>>}
     */
    public function compute(Board $group): array
    {
        $members = $group->getMembers()->toArray();
        $memberIds = array_map(static fn (BoardMember $member): string => (string) $member->getId(), $members);
        $names = array_combine($memberIds, array_map(static fn (BoardMember $member): string => (string) $member->getDisplayName(), $members));

        $paid = $this->expenseRepository->sumPaidByMember($group);
        $owed = $this->expenseRepository->sumSharesByMember($group);
        $sent = $this->settlementRepository->sumSentByMember($group);
        $received = $this->settlementRepository->sumReceivedByMember($group);

        $balances = $this->balanceCalculator->balances($memberIds, $paid, $owed, $sent, $received);

        return [
            'totalSpentCents' => array_sum($paid),
            'balances'        => array_map(static fn (string $memberId): array => [
                'memberId'      => $memberId,
                'displayName'   => $names[$memberId],
                'paidCents'     => $paid[$memberId] ?? 0,
                'owedCents'     => $owed[$memberId] ?? 0,
                'sentCents'     => $sent[$memberId] ?? 0,
                'receivedCents' => $received[$memberId] ?? 0,
                'balanceCents'  => $balances[$memberId],
            ], $memberIds),
            'transfers' => array_map(static fn (array $transfer): array => [
                ...$transfer,
                'fromName' => $names[$transfer['from']],
                'toName'   => $names[$transfer['to']],
            ], $this->balanceCalculator->plan($balances)),
        ];
    }
}
