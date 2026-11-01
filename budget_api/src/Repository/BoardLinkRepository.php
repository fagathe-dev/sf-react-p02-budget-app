<?php

namespace App\Repository;

use App\Doctrine\Type\PeriodType;
use App\Entity\Board;
use App\Entity\BoardLink;
use App\Entity\BoardMember;
use App\ValueObject\Period;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Fagathe\CorePhp\Trait\DatetimeTrait;

/**
 * @extends ServiceEntityRepository<BoardLink>
 */
class BoardLinkRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BoardLink::class);
    }

    /**
     * Liens actifs en $period qui remontent dans $target, depuis des boards non archivés.
     *
     * @return list<BoardLink>
     */
    public function findActiveTargeting(Board $target, Period $period): array
    {
        return $this->createQueryBuilder('l')
            ->addSelect('s', 'm')
            ->innerJoin('l.sourceBoard', 's')
            ->leftJoin('l.member', 'm')
            ->andWhere('l.targetBoard = :target')
            ->andWhere('s.archivedAt IS NULL')
            ->andWhere('l.activeFrom <= :period')
            ->andWhere('l.activeTo IS NULL OR l.activeTo >= :period')
            ->setParameter('target', $target->getId(), UuidType::NAME)
            ->setParameter('period', $period, PeriodType::NAME)
            ->orderBy('l.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Liens encore ouverts (sans fin) d'un membre.
     *
     * @return list<BoardLink>
     */
    public function findOpenForMember(BoardMember $member, ?string $type = null): array
    {
        $qb = $this->createQueryBuilder('l')
            ->andWhere('l.member = :member')
            ->andWhere('l.activeTo IS NULL')
            ->setParameter('member', $member->getId(), UuidType::NAME);

        if ($type !== null) {
            $qb->andWhere('l.type = :type')->setParameter('type', $type);
        }

        return $qb->getQuery()->getResult();
    }

    public function save(BoardLink $link, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $link->getCreatedAt() === null) {
            $link->setCreatedAt($now);
        }

        if (!$isCreation) {
            $link->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($link);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(BoardLink $link, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($link);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
