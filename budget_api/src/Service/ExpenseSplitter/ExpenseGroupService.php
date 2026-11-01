<?php

declare(strict_types=1);

namespace App\Service\ExpenseSplitter;

use App\Dto\ExpenseSplitter\CreateExpenseGroupDto;
use App\Dto\ExpenseSplitter\UpdateExpenseGroupDto;
use App\Entity\Board;
use App\Enum\Budget\BoardTypeEnum;
use App\Repository\BoardRepository;
use App\Security\Voter\BoardVoter;
use App\Service\Budget\BoardFactory;
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
 * Groupes de dépenses : des Board de type expense_group, avec leurs participants (BoardMember).
 */
final class ExpenseGroupService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, BudgetServiceTrait;

    private const TYPE = BoardTypeEnum::ExpenseGroup->value;

    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly BoardRepository $boardRepository,
        private readonly BoardFactory $boardFactory,
        private readonly BalanceService $balanceService,
    ) {}

    /**
     * GET /api/expense-groups
     */
    public function listGroups(): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        try {
            $groups = array_map(function (Board $group) use ($user): array {
                $balances = $this->balanceService->compute($group);
                $myMemberId = $group->findMemberForUser($user)?->getId()?->toRfc4122();
                $mine = array_values(array_filter($balances['balances'], static fn (array $row): bool => $row['memberId'] === $myMemberId));

                return [
                    'id'              => (string) $group->getId(),
                    'name'            => $group->getName(),
                    'currency'        => $group->getCurrency(),
                    'memberCount'     => count($group->getSplittableMembers()),
                    'totalSpentCents' => $balances['totalSpentCents'],
                    'myBalanceCents'  => $mine[0]['balanceCents'] ?? null,
                    'createdAt'       => $group->getCreatedAt(),
                ];
            }, $this->boardRepository->findForUser($user, [self::TYPE]));

            return $this->sendJson(['groups' => $groups]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du chargement des groupes.', 'expense_group.list.error', $e);
        }
    }

    /**
     * POST /api/expense-groups
     */
    public function createGroup(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        $dto = $this->deserializeDto($request->getContent(), CreateExpenseGroupDto::class);
        if (!$dto instanceof CreateExpenseGroupDto) {
            return $dto;
        }

        try {
            $group = $this->boardFactory->create($user, self::TYPE, $dto->name, $dto->currency, [], $dto->participants);

            return $this->sendJson($this->describe($group), Response::HTTP_CREATED, context: ['groups' => ['board.read', 'member.read']]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la création du groupe.', 'expense_group.create.error', $e);
        }
    }

    /**
     * GET /api/expense-groups/{id}
     */
    public function getGroup(string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::VIEW, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        try {
            return $this->sendJson($this->describe($group), context: ['groups' => ['board.read', 'member.read']]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors du chargement du groupe.', 'expense_group.get.error', $e, ['group_id' => $groupId]);
        }
    }

    /**
     * PUT /api/expense-groups/{id} : renommer.
     */
    public function updateGroup(Request $request, string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::EDIT, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        $dto = $this->deserializeDto($request->getContent(), UpdateExpenseGroupDto::class);
        if (!$dto instanceof UpdateExpenseGroupDto) {
            return $dto;
        }

        try {
            $previousName = $group->getName();
            $this->boardRepository->save($group->setName(trim($dto->name)));
            $this->publish('board', $group->getId(), 'board.updated', ['before' => ['name' => $previousName], 'after' => ['name' => $group->getName()]]);

            return $this->sendJson($this->describe($group), context: ['groups' => ['board.read', 'member.read']]);
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la modification du groupe.', 'expense_group.update.error', $e, ['group_id' => $groupId]);
        }
    }

    /**
     * DELETE /api/expense-groups/{id} : clôturer (archiver), rien n'est supprimé.
     */
    public function closeGroup(string $groupId): object
    {
        $group = $this->findGrantedBoard($groupId, BoardVoter::MANAGE_MEMBERS, self::TYPE);
        if (!$group instanceof Board) {
            return $group;
        }

        try {
            $this->boardRepository->save($group->archive($this->now()));
            $this->publish('board', $group->getId(), 'board.archived', ['name' => $group->getName()]);

            return $this->sendNoContent();
        } catch (Throwable $e) {
            return $this->internalError('Erreur interne lors de la clôture du groupe.', 'expense_group.close.error', $e, ['group_id' => $groupId]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function describe(Board $group): array
    {
        $user = $this->getAuthenticatedUser();

        return [
            'group'      => $group,
            'members'    => $group->getSplittableMembers(),
            'myMemberId' => $user !== null ? $group->findMemberForUser($user)?->getId()?->toRfc4122() : null,
            ...$this->balanceService->compute($group),
        ];
    }
}
