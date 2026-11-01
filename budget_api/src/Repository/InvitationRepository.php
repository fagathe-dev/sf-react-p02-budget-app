<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\BoardMember;
use App\Entity\Invitation;
use App\Enum\Budget\InvitationStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<Invitation>
 */
class InvitationRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Invitation::class);
    }

    public function findOneByTokenHash(string $tokenHash): ?Invitation
    {
        return $this->createQueryBuilder('i')
            ->addSelect('b', 'm')
            ->innerJoin('i.board', 'b')
            ->innerJoin('i.member', 'm')
            ->andWhere('i.tokenHash = :hash')
            ->setParameter('hash', $tokenHash)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findOneInBoard(Board $board, string $invitationId): ?Invitation
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.id = :id')
            ->andWhere('i.board = :board')
            ->setParameter('id', $invitationId, UuidType::NAME)
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return list<Invitation>
     */
    public function findPendingForMember(BoardMember $member): array
    {
        return $this->findBy(['member' => $member, 'status' => InvitationStatusEnum::Pending]);
    }

    public function save(Invitation $invitation, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $invitation->getCreatedAt() === null) {
            $invitation->setCreatedAt($now);
        }

        if (!$isCreation) {
            $invitation->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($invitation);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(Invitation $invitation, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($invitation);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
