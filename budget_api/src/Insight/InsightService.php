<?php

declare(strict_types=1);

namespace App\Insight;

use App\Calculator\BoardCalculator;
use App\Calculator\Result\BoardResult;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\ItemKindEnum;
use App\Repository\BoardRepository;
use App\Security\AuthenticatedUserTrait;
use App\Service\Budget\BoardFactory;
use App\ValueObject\Period;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Http\ResponseTrait;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\AutowireIterator;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Page d'accueil : KPI du mois, insights, postes à venir et boards partagés, en un appel.
 * Réutilise BoardCalculator sur le mois affiché, le précédent et les deux suivants.
 */
final class InsightService
{
    use ResponseTrait, DatetimeTrait, LoggerTrait, AuthenticatedUserTrait;

    /**
     * @param iterable<InsightRuleInterface> $rules
     */
    public function __construct(
        private readonly Security $security,
        private readonly BoardRepository $boardRepository,
        private readonly BoardFactory $boardFactory,
        private readonly BoardCalculator $calculator,
        #[AutowireIterator(InsightRuleInterface::class)]
        private readonly iterable $rules,
    ) {}

    /**
     * GET /api/insights?month=AAAA-MM
     */
    public function getInsights(Request $request): object
    {
        $user = $this->getAuthenticatedUser();
        if (!$user) {
            return $this->sendUnauthorized('Utilisateur non authentifié.');
        }

        $month = $request->query->get('month');
        if ($month !== null && $month !== '' && !Period::isValid($month)) {
            return $this->sendViolations(['month' => 'Le mois doit être au format AAAA-MM.']);
        }
        $period = $month !== null && $month !== '' ? Period::fromString($month) : Period::current();

        try {
            $personalBoard = $this->boardRepository->findPersonalBoard($user) ?? $this->boardFactory->createPersonal($user);

            $context = new InsightContext(
                user: $user,
                period: $period,
                personal: $this->calculator->calculate($personalBoard, $period),
                previous: $this->calculator->calculate($personalBoard, $period->previous()),
                upcoming: [
                    $period->plus(1)->toString() => $this->calculator->calculate($personalBoard, $period->plus(1)),
                    $period->plus(2)->toString() => $this->calculator->calculate($personalBoard, $period->plus(2)),
                ],
                sharedBoards: array_map(
                    fn ($board): BoardResult => $this->calculator->calculate($board, $period),
                    $this->boardRepository->findForUser($user, [BoardTypeEnum::Shared->value])
                ),
                today: $this->now(),
            );

            return $this->sendJson([
                'period'       => $period->toString(),
                'kpis'         => $this->kpis($context),
                'insights'     => $this->evaluateRules($context),
                'upcoming'     => $this->upcoming($context->personal),
                'sharedBoards' => array_map(fn (BoardResult $board): array => $this->sharedSummary($board, $context), $context->sharedBoards),
            ]);
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Critical,
                ['message' => 'Erreur critique lors du calcul des insights', 'user_id' => (string) $user->getId(), 'exception' => $e],
                ['action' => 'insight.get.error']
            );

            return $this->sendJson(['message' => 'Erreur interne lors du chargement de l\'accueil.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @return list<Insight> du plus urgent au moins urgent, puis par montant
     */
    private function evaluateRules(InsightContext $context): array
    {
        $insights = [];

        foreach ($this->rules as $rule) {
            if ($rule->supports($context)) {
                array_push($insights, ...$rule->evaluate($context));
            }
        }

        usort($insights, static fn (Insight $a, Insight $b): int => [$a->level->weight(), $b->amountCents] <=> [$b->level->weight(), $a->amountCents]);

        return $insights;
    }

    /**
     * @return array<string, int|float|null>
     */
    private function kpis(InsightContext $context): array
    {
        $current = $context->personal;
        $previous = $context->previous;

        return [
            'incomeCents'          => $current->getTotal('incomeCents'),
            'chargesCents'         => $current->getTotal('chargesCents'),
            'sharedChargesCents'   => $current->getTotal('rollupExpenseCents'),
            'savingsCents'         => $current->getTotal('savingsCents'),
            'remainingCents'       => $current->getTotal('remainingCents'),
            'chargesRatio'         => $current->totals['chargesRatio'],
            'remainingDeltaCents'  => $current->getTotal('remainingCents') - $previous->getTotal('remainingCents'),
            'chargesDeltaCents'    => $current->getTotal('chargesCents') - $previous->getTotal('chargesCents'),
        ];
    }

    /**
     * Postes qui tombent ce mois-ci, par jour de prélèvement, avec la part de l'utilisateur.
     *
     * @return list<array<string, mixed>>
     */
    private function upcoming(BoardResult $personal): array
    {
        $upcoming = [];

        foreach ($personal->lines as $line) {
            if ($line->isDue && $line->amountCents > 0 && $line->kind !== ItemKindEnum::Income->value) {
                $upcoming[] = [
                    'itemId'      => $line->itemId,
                    'boardId'     => $personal->boardId,
                    'boardName'   => $personal->name,
                    'label'       => $line->label,
                    'kind'        => $line->kind,
                    'dueDay'      => $line->dueDay,
                    'amountCents' => $line->amountCents,
                    'tags'        => $line->tags,
                ];
            }
        }

        foreach ($personal->rollups as $rollup) {
            foreach ($rollup->lines as $line) {
                if ($line->isDue && $line->amountCents > 0) {
                    $upcoming[] = [
                        'itemId'      => $line->sourceItemId,
                        'boardId'     => $rollup->sourceBoardId,
                        'boardName'   => $rollup->sourceBoardName,
                        'label'       => $line->label,
                        'kind'        => $line->kind,
                        'dueDay'      => $line->dueDay,
                        'amountCents' => $line->amountCents,
                        'tags'        => $line->tags,
                    ];
                }
            }
        }

        // Jours de prélèvement inconnus en fin de liste
        usort($upcoming, static fn (array $a, array $b): int => [$a['dueDay'] ?? 99, $a['label']] <=> [$b['dueDay'] ?? 99, $b['label']]);

        return $upcoming;
    }

    /**
     * @return array<string, mixed>
     */
    private function sharedSummary(BoardResult $board, InsightContext $context): array
    {
        $memberId = $context->memberIdIn($board);

        return [
            'boardId'           => $board->boardId,
            'name'              => $board->name,
            'householdCents'    => $board->getTotal('householdCents'),
            'myShareCents'      => $memberId !== null ? ($board->memberShares[$memberId] ?? 0) : 0,
            'contributionCents' => $memberId !== null ? (int) ($board->balance['contributions'][$memberId] ?? 0) : 0,
            'balanceCents'      => $memberId !== null ? (int) ($board->balance['balances'][$memberId] ?? 0) : 0,
            'summary'           => $board->balance['summary'] ?? null,
        ];
    }
}
