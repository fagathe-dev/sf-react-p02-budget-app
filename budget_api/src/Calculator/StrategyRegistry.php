<?php

declare(strict_types=1);

namespace App\Calculator;

use App\BoardType\BoardTypeHandlerInterface;
use App\Calculator\Adjustment\AdjustmentHandlerInterface;
use App\Calculator\Allocation\AllocationHandlerInterface;
use App\Calculator\Exception\UnknownStrategyException;
use App\Calculator\Link\BoardLinkHandlerInterface;
use App\Calculator\Recurrence\RecurrenceHandlerInterface;
use App\Calculator\Split\SplitStrategyInterface;
use Symfony\Component\DependencyInjection\Attribute\AutowireLocator;
use Symfony\Contracts\Service\ServiceProviderInterface;

/**
 * Point d'entrée unique vers les stratégies taguées, retrouvées par leur code stocké en base.
 * Ajouter une stratégie = créer une classe #[AsTaggedItem('<code>')], sans toucher à ce registre.
 */
final readonly class StrategyRegistry
{
    /**
     * @param ServiceProviderInterface<RecurrenceHandlerInterface> $recurrences
     * @param ServiceProviderInterface<AllocationHandlerInterface> $allocations
     * @param ServiceProviderInterface<AdjustmentHandlerInterface> $adjustments
     * @param ServiceProviderInterface<SplitStrategyInterface> $splits
     * @param ServiceProviderInterface<BoardLinkHandlerInterface> $links
     * @param ServiceProviderInterface<BoardTypeHandlerInterface> $boardTypes
     */
    public function __construct(
        #[AutowireLocator(RecurrenceHandlerInterface::class)]
        private ServiceProviderInterface $recurrences,
        #[AutowireLocator(AllocationHandlerInterface::class)]
        private ServiceProviderInterface $allocations,
        #[AutowireLocator(AdjustmentHandlerInterface::class)]
        private ServiceProviderInterface $adjustments,
        #[AutowireLocator(SplitStrategyInterface::class)]
        private ServiceProviderInterface $splits,
        #[AutowireLocator(BoardLinkHandlerInterface::class)]
        private ServiceProviderInterface $links,
        #[AutowireLocator(BoardTypeHandlerInterface::class)]
        private ServiceProviderInterface $boardTypes,
    ) {}

    public function recurrence(string $code): RecurrenceHandlerInterface
    {
        return $this->resolve($this->recurrences, $code, 'récurrence');
    }

    public function allocation(string $code): AllocationHandlerInterface
    {
        return $this->resolve($this->allocations, $code, 'prise en compte');
    }

    public function adjustment(string $code): AdjustmentHandlerInterface
    {
        return $this->resolve($this->adjustments, $code, 'exception');
    }

    public function split(string $code): SplitStrategyInterface
    {
        return $this->resolve($this->splits, $code, 'répartition');
    }

    public function link(string $code): BoardLinkHandlerInterface
    {
        return $this->resolve($this->links, $code, 'lien');
    }

    public function boardType(string $code): BoardTypeHandlerInterface
    {
        return $this->resolve($this->boardTypes, $code, 'type de board');
    }

    /**
     * Codes disponibles par famille (validation des DTO, messages d'erreur).
     *
     * @return list<string>
     */
    public function codes(string $family): array
    {
        $locator = match ($family) {
            'recurrence' => $this->recurrences,
            'allocation' => $this->allocations,
            'adjustment' => $this->adjustments,
            'split' => $this->splits,
            'link' => $this->links,
            'boardType' => $this->boardTypes,
        };

        return array_map('strval', array_keys($locator->getProvidedServices()));
    }

    /**
     * @template T of object
     *
     * @param ServiceProviderInterface<T> $locator
     *
     * @return T
     */
    private function resolve(ServiceProviderInterface $locator, string $code, string $kind): object
    {
        if (!$locator->has($code)) {
            throw UnknownStrategyException::for($kind, $code, array_map('strval', array_keys($locator->getProvidedServices())));
        }

        return $locator->get($code);
    }
}
