<?php

declare(strict_types=1);

namespace App\BoardType;

use App\Calculator\Link\ShareRollupLink;
use App\Entity\BoardLink;
use App\Entity\BoardMember;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\ItemKindEnum;
use App\Repository\BoardLinkRepository;
use App\Repository\BoardRepository;
use App\ValueObject\Period;
use Symfony\Component\DependencyInjection\Attribute\AsTaggedItem;

/**
 * Charges communes d'un foyer. Un membre lié reçoit un BoardLink share_rollup vers son board perso.
 */
#[AsTaggedItem(self::CODE)]
final readonly class SharedBoardType implements BoardTypeHandlerInterface
{
    public const CODE = BoardTypeEnum::Shared->value;

    public function __construct(
        private BoardRepository $boardRepository,
        private BoardLinkRepository $linkRepository,
    ) {}

    /**
     * Épargne commune autorisée, revenus réservés au board perso en V1.
     */
    public function allowsItemKind(ItemKindEnum $kind): bool
    {
        return $kind !== ItemKindEnum::Income;
    }

    public function acceptsMembers(): bool
    {
        return true;
    }

    public function onMemberJoined(BoardMember $member, Period $from): void
    {
        $user = $member->getUser();
        if ($user === null || $this->linkRepository->findOpenForMember($member, ShareRollupLink::CODE) !== []) {
            return;
        }

        $personalBoard = $this->boardRepository->findPersonalBoard($user);
        if ($personalBoard === null) {
            return;
        }

        $link = (new BoardLink())
            ->setSourceBoard($member->getBoard())
            ->setTargetBoard($personalBoard)
            ->setMember($member)
            ->setType(ShareRollupLink::CODE)
            ->setActiveFrom($from);

        $this->linkRepository->save($link, isCreation: true);
    }

    public function onMemberLeft(BoardMember $member, Period $lastPeriod): void
    {
        foreach ($this->linkRepository->findOpenForMember($member) as $link) {
            $this->linkRepository->save($link->close($lastPeriod), flush: false);
        }
    }
}
