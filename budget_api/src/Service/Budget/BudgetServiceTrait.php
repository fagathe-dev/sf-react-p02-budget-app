<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\Result\BoardResult;
use App\Entity\Board;
use App\Event\DomainEventOccurred;
use App\Security\AuthenticatedUserTrait;
use App\Security\Voter\BoardVoter;
use App\ValueObject\Period;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;
use Throwable;

/**
 * Outils communs aux services du budget. La classe hôte utilise ResponseTrait, DatetimeTrait et LoggerTrait,
 * et injecte $security, $serializer, $validator, $boardRepository et $dispatcher.
 */
trait BudgetServiceTrait
{
    use AuthenticatedUserTrait;

    /**
     * Le board si l'utilisateur a le droit demandé, sinon la réponse d'erreur (404 / 403) à renvoyer telle quelle.
     *
     * @return Board|object
     */
    private function findGrantedBoard(string $boardId, string $attribute, ?string $type = null): object
    {
        $board = $this->boardRepository->findActive($boardId);

        if ($board === null || ($type !== null && $board->getType() !== $type)) {
            return $this->notFoundResponse('Board introuvable.');
        }

        if (!$this->security->isGranted($attribute, $board)) {
            return $this->sendForbidden('Vous n\'avez pas les droits nécessaires sur ce board.');
        }

        return $board;
    }

    /**
     * ?month=AAAA-MM, mois en cours par défaut ; null si le format est invalide.
     */
    private function resolvePeriod(?string $month): ?Period
    {
        if ($month === null || $month === '') {
            return Period::current();
        }

        return Period::isValid($month) ? Period::fromString($month) : null;
    }

    private function invalidPeriodResponse(): object
    {
        return $this->sendViolations(['month' => 'Le mois doit être au format AAAA-MM.']);
    }

    /**
     * Désérialise et valide un DTO ; renvoie le DTO, ou la réponse d'erreur (400) à renvoyer telle quelle.
     *
     * @template T of object
     *
     * @param class-string<T> $class
     *
     * @return T|object
     */
    private function deserializeDto(string $json, string $class): object
    {
        try {
            $dto = $this->serializer->deserialize($json !== '' ? $json : '{}', $class, 'json');
        } catch (Throwable) {
            return $this->sendJson(['message' => 'Format de données JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            return $this->sendViolations($violations);
        }

        return $dto;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function publish(string $aggregateType, Uuid $aggregateId, string $type, array $payload = []): void
    {
        $this->dispatcher->dispatch(new DomainEventOccurred(
            aggregateType: $aggregateType,
            aggregateId: $aggregateId,
            type: $type,
            payload: $payload,
            actor: $this->getAuthenticatedUser(),
        ));
    }

    /**
     * @param array<string, mixed> $data
     */
    private function internalError(string $message, string $action, Throwable $e, array $data = []): object
    {
        $this->generateLog(
            LoggerLevelEnum::Critical,
            [
                'message'   => $message,
                'user_id'   => (string) $this->getAuthenticatedUser()?->getId(),
                'data'      => $data,
                'exception' => $e,
            ],
            ['action' => $action]
        );

        return $this->sendJson(['message' => $message], Response::HTTP_INTERNAL_SERVER_ERROR);
    }

    /**
     * Board calculé + ce dont l'écran a besoin (réglages, droits, mon membre).
     *
     * @return array<string, mixed>
     */
    private function presentBoard(Board $board, BoardResult $result): array
    {
        $user = $this->getAuthenticatedUser();
        $myMember = $user !== null ? $board->findMemberForUser($user) : null;

        return [
            'board' => [
                'id'          => (string) $board->getId(),
                'type'        => $board->getType(),
                'name'        => $board->getName(),
                'currency'    => $board->getCurrency(),
                'settings'    => $board->getSettings(),
                'myMemberId'  => $myMember?->getId()?->toRfc4122(),
                'permissions' => [
                    'canEdit'          => $this->security->isGranted(BoardVoter::EDIT, $board),
                    'canManageMembers' => $this->security->isGranted(BoardVoter::MANAGE_MEMBERS, $board),
                ],
            ],
            ...get_object_vars($result),
        ];
    }
}
