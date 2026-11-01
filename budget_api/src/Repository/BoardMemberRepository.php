<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\BoardMember;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Fagathe\CorePhp\Trait\DatetimeTrait;

/**
 * @extends ServiceEntityRepository<BoardMember>
 */
class BoardMemberRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BoardMember::class);
    }

    public function findOneByBoardAndUser(Board $board, User $user): ?BoardMember
    {
        return $this->findOneBy(['board' => $board, 'user' => $user]);
    }

    /**
     * Toutes les adhésions liées à ce compte (suppression du compte).
     *
     * @return list<BoardMember>
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('m')
            ->addSelect('b')
            ->innerJoin('m.board', 'b')
            ->andWhere('m.user = :user')
            ->setParameter('user', $user->getId(), UuidType::NAME)
            ->getQuery()
            ->getResult();
    }

    public function save(BoardMember $member, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $member->getCreatedAt() === null) {
            $member->setCreatedAt($now);
        }

        if (!$isCreation) {
            $member->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($member);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(BoardMember $member, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($member);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
