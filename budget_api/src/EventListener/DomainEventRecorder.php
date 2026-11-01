<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\DomainEvent;
use App\Event\DomainEventOccurred;
use App\Repository\DomainEventRepository;
use Fagathe\CorePhp\Enum\LoggerLevelEnum;
use Fagathe\CorePhp\Trait\LoggerTrait;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Throwable;

/**
 * Écrit chaque fait métier dans le journal (ajout seul). Un échec du journal ne casse pas l'action métier.
 */
#[AsEventListener]
final readonly class DomainEventRecorder
{
    use LoggerTrait;

    public function __construct(private DomainEventRepository $repository) {}

    public function __invoke(DomainEventOccurred $event): void
    {
        try {
            $this->repository->save(new DomainEvent(
                aggregateType: $event->aggregateType,
                aggregateId: $event->aggregateId,
                type: $event->type,
                payload: $event->payload,
                actor: $event->actor,
            ));
        } catch (Throwable $e) {
            $this->generateLog(
                LoggerLevelEnum::Error,
                [
                    'message'   => 'Échec de l\'écriture d\'un événement dans le journal',
                    'data'      => ['type' => $event->type, 'aggregate_id' => (string) $event->aggregateId],
                    'exception' => $e,
                ],
                ['action' => 'domain_event.record.error']
            );
        }
    }
}
