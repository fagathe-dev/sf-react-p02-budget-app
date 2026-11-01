<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\UserActivatedEvent;
use App\Repository\BoardRepository;
use App\Service\Budget\BoardFactory;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Throwable;

/**
 * Crée le board perso « Mon budget » à l'activation du compte. Idempotent : rien si un board perso existe.
 */
#[AsEventListener]
final readonly class CreatePersonalBoardListener
{
    use LoggerTrait;

    public function __construct(
        private BoardRepository $boardRepository,
        private BoardFactory $boardFactory,
    ) {}

    public function __invoke(UserActivatedEvent $event): void
    {
        if ($this->boardRepository->findPersonalBoard($event->user) !== null) {
            return;
        }

        try {
            $this->boardFactory->createPersonal($event->user);
        } catch (Throwable $e) {
            // L'activation du compte ne doit pas échouer : le board sera recréé à la prochaine lecture
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Échec de la création du board perso à l\'activation',
                    'user_id'   => (string) $event->user->getId(),
                    'exception' => $e,
                ],
                ['action' => 'board.personal.create.error']
            );
        }
    }
}
