<?php

declare(strict_types=1);

namespace App\Service\ExpenseSplitter;

use App\Dto\ExpenseSplitter\RecordSettlementDto;
use App\Entity\Board;
use App\Entity\Embeddable\Money;
use App\Entity\Settlement;
use App\Enum\Budget\BoardTypeEnum;
use App\Repository\BoardRepository;
use App\Repository\SettlementRepository;
use App\Security\Voter\BoardVoter;
use App\Service\Budget\BudgetServiceTrait;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;
use Throwable;

/**
 * « Marquer comme payé » : un remboursement met les soldes à jour sans toucher aux dépenses.
 */
final class SettlementService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    private const TYPE = BoardTypeEnum::ExpenseGroup->value;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly SettlementRepository $settlementRepository,
        private readonly BalanceService $balanceService,
    ) {}

    /**
     * GET /api/expense-groups/{id}/settlements
     */
    public function listSettlements(string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::VIEW, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        return $this->sendJson(['settlements' => $this->settlementRepository->findForGroup($group)], context: ['groups' => ['settlement.read']]);
    }

    /**
     * POST /api/expense-groups/{id}/settlements
     */
    public function recordSettlement(Request $request, string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::EDIT, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        $dto = $this->deserializeDto($request->getContent(), RecordSettlementDto::class);
        if (!$dto instanceof RecordSettlementDto) {
            return $dto;
        }

        $from = $group->findMember($dto->fromMemberId);
        $to = $group->findMember($dto->toMemberId);
        if ($from === null || $to === null || $from->isLeft() || $to->isLeft()) {
            return $this->sendViolations(['fromMemberId' => 'Les deux participants doivent faire partie du groupe.']);
        }

        try {
            $settlement = new Settlement(
                board: $group,
                fromMember: $from,
                toMember: $to,
                amount: Money::of((int) $dto->amountCents, $group->getCurrency()),
                settledOn: $dto->settledOn !== null ? \DateTimeImmutable::createFromFormat('!Y-m-d', $dto->settledOn) : $this->now()->setTime(0, 0),
                note: $dto->note !== null && trim($dto->note) !== '' ? trim($dto->note) : null,
                createdBy: $this->getAuthenticatedUser(),
            );

            $this->settlementRepository->save($settlement);
            $this->publish('settlement', $settlement->getId(), 'settlement.recorded', [
                'groupId'      => (string) $group->getId(),
                'fromMemberId' => (string) $from->getId(),
                'toMemberId'   => (string) $to->getId(),
                'amountCents'  => $settlement->getAmount()->getAmountCents(),
            ]);

            return $this->sendJson(
                ['settlement' => $settlement, ...$this->balanceService->compute($group)],
                Response::HTTP_CREATED,
                context: ['groups' => ['settlement.read']]
            );
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'enregistrement du remboursement.', 'settlement.record.error', $e, ['group_id' => $groupId]);
        }
    }

    /**
     * DELETE /api/expense-groups/{id}/settlements/{settlementId} : annulation (voidedAt).
     */
    public function voidSettlement(string $groupId, string $settlementId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::EDIT, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        $settlement = $this->settlementRepository->findOneInGroup($group, $settlementId);
        if (!$settlement || $settlement->isVoided()) {
            return $this->notFoundResponse('Remboursement introuvable ou déjà annulé.');
        }

        try {
            $this->settlementRepository->save($settlement->void($this->now()));
            $this->publish('settlement', $settlement->getId(), 'settlement.voided', [
                'groupId'     => (string) $group->getId(),
                'amountCents' => $settlement->getAmount()->getAmountCents(),
            ]);

            return $this->sendJson($this->balanceService->compute($group));
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de l\'annulation du remboursement.', 'settlement.void.error', $e, ['settlement_id' => $settlementId]);
        }
    }
}
