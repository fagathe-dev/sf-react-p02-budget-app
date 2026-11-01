<?php

declare(strict_types=1);

namespace App\Insight;

use App\Calculator\Result\BoardResult;
use App\Entity\User;
use App\ValueObject\Period;

/**
 * Tout ce qu'une règle d'insight peut lire : rien n'est recalculé par les règles elles-mêmes.
 */
final readonly class InsightContext
{
    public const DEFAULT_CHARGES_RATIO_THRESHOLD = 50.0;
    public const DEFAULT_LARGE_DUE_THRESHOLD_CENTS = 30000;

    /**
     * @param array<string, BoardResult> $upcoming board perso des 2 mois suivants, indexé par "AAAA-MM"
     * @param list<BoardResult> $sharedBoards boards partagés du mois dont l'utilisateur est membre
     */
    public function __construct(
        public User $user,
        public Period $period,
        public BoardResult $personal,
        public BoardResult $previous,
        public array $upcoming,
        public array $sharedBoards,
        public \DateTimeImmutable $today,
    ) {}

    public function chargesRatioThreshold(): float
    {
        return (float) $this->user->getSetting('chargesRatioThreshold', self::DEFAULT_CHARGES_RATIO_THRESHOLD);
    }

    public function largeDueThresholdCents(): int
    {
        return (int) $this->user->getSetting('largeDueThresholdCents', self::DEFAULT_LARGE_DUE_THRESHOLD_CENTS);
    }

    public function memberIdIn(BoardResult $board): ?string
    {
        return $board->findMemberIdForUser((string) $this->user->getId());
    }

    /**
     * Le mois affiché est-il déjà commencé ? (mois passé, ou mois en cours)
     */
    public function isStarted(): bool
    {
        return !Period::fromDate($this->today)->isBefore($this->period);
    }
}
