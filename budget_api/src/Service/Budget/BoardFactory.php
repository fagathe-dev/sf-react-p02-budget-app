<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Calculator\StrategyRegistry;
use App\Entity\Board;
use App\Entity\BoardMember;
use App\Entity\User;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\MemberRoleEnum;
use App\Event\DomainEventOccurred;
use App\Repository\BoardRepository;
use App\ValueObject\Period;
use RuntimeException;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

/**
 * Crée un board avec son propriétaire comme premier membre, puis laisse son BoardTypeHandler réagir
 * (board partagé : remontée de la part du propriétaire dans son board perso).
 */
final readonly class BoardFactory
{
    public const PERSONAL_BOARD_NAME = 'Mon budget';

    public function __construct(
        private BoardRepository $boardRepository,
        private StrategyRegistry $registry,
        private EventDispatcherInterface $dispatcher,
    ) {}

    public function createPersonal(User $user): Board
    {
        return $this->create($user, BoardTypeEnum::Personal->value, self::PERSONAL_BOARD_NAME);
    }

    /**
     * @param array<string, mixed> $settings
     * @param list<string> $guestNames invités locaux (simples prénoms)
     */
    public function create(User $owner, string $type, string $name, string $currency = 'EUR', array $settings = [], array $guestNames = []): Board
    {
        $handler = $this->registry->boardType($type);
        $now = new \DateTimeImmutable();

        $board = (new Board())
            ->setOwner($owner)
            ->setType($type)
            ->setName(trim($name))
            ->setCurrency($currency)
            ->setSettings($settings);

        $ownerMember = (new BoardMember())
            ->setBoard($board)
            ->setDisplayName(self::displayNameOf($owner))
            ->setRole(MemberRoleEnum::Owner)
            ->attachUser($owner)
            ->activate($now);

        if ($handler->acceptsMembers()) {
            foreach ($guestNames as $guestName) {
                (new BoardMember())
                    ->setBoard($board)
                    ->setDisplayName(trim($guestName))
                    ->setRole(MemberRoleEnum::Editor)
                    ->activate($now);
            }
        }

        if (!$this->boardRepository->save($board, isCreation: true)) {
            throw new RuntimeException('Impossible d\'enregistrer le board.');
        }

        $handler->onMemberJoined($ownerMember, Period::current());

        $this->dispatcher->dispatch(new DomainEventOccurred(
            aggregateType: 'board',
            aggregateId: $board->getId(),
            type: 'board.created',
            payload: ['type' => $type, 'name' => $board->getName(), 'guests' => $guestNames],
            actor: $owner,
        ));

        return $board;
    }

    public static function displayNameOf(User $user): string
    {
        $firstname = trim((string) $user->getFirstname());

        return $firstname !== '' ? $firstname : (string) $user->getUsername();
    }
}
