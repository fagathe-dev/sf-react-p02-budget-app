<?php

declare(strict_types=1);

namespace App\Service\Budget;

use App\Entity\User;
use App\Enum\Budget\MemberRoleEnum;
use App\Repository\BoardLinkRepository;
use App\Repository\BoardMemberRepository;
use App\Repository\BoardRepository;
use App\ValueObject\Period;

/**
 * À la suppression d'un compte : les boards des autres sont conservés.
 * - board partagé dont il est propriétaire : transmis au premier autre membre lié (sinon supprimé en cascade) ;
 * - ses adhésions : converties en invités locaux, remontées arrêtées ;
 * - son board perso et ses tags : supprimés en cascade avec le compte.
 * Rien n'est flushé ici : les changements partent dans le même flush que UserRepository::remove().
 */
final readonly class AccountBoardsCleaner
{
    public function __construct(
        private BoardRepository $boardRepository,
        private BoardMemberRepository $memberRepository,
        private BoardLinkRepository $linkRepository,
    ) {}

    public function beforeAccountDeletion(User $user): void
    {
        $userId = (string) $user->getId();

        foreach ($this->boardRepository->findOwnedBy($user) as $board) {
            if ($board->isPersonal()) {
                continue;
            }

            foreach ($board->getSplittableMembers() as $member) {
                if ($member->getUser() !== null && $member->isActive() && (string) $member->getUser()->getId() !== $userId) {
                    $board->setOwner($member->getUser());
                    $member->setRole(MemberRoleEnum::Owner);
                    $this->boardRepository->save($board, flush: false);
                    break;
                }
            }
        }

        foreach ($this->memberRepository->findByUser($user) as $member) {
            foreach ($this->linkRepository->findOpenForMember($member) as $link) {
                $this->linkRepository->save($link->close(Period::current()), flush: false);
            }

            if ($member->isOwner() && (string) $member->getBoard()->getOwner()?->getId() !== $userId) {
                $member->setRole(MemberRoleEnum::Editor);
            }

            $this->memberRepository->save($member->detachUser(), flush: false);
        }
    }
}
