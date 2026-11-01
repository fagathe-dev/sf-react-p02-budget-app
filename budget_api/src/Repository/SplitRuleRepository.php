<?php

namespace App\Repository;

use App\Doctrine\Type\PeriodType;
use App\Entity\Board;
use App\Entity\BudgetItem;
use App\Entity\SplitRule;
use App\ValueObject\Period;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<SplitRule>
 */
class SplitRuleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SplitRule::class);
    }

    /**
     * Règles du board (et de ses postes) en vigueur jusqu'à $period, la plus récente d'abord.
     *
     * @return list<SplitRule>
     */
    public function findEffectiveForBoard(Board $board, Period $period): array
    {
        return $this->createQueryBuilder('r')
            ->addSelect('e', 'm')
            ->leftJoin('r.entries', 'e')
            ->leftJoin('e.member', 'm')
            ->andWhere('r.board = :board')
            ->andWhere('r.effectiveFrom <= :period')
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->setParameter('period', $period, PeriodType::NAME)
            ->orderBy('r.effectiveFrom', 'DESC')
            ->addOrderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * La règle du board (item = null) en vigueur en $period.
     */
    public function findBoardRuleAt(Board $board, Period $period): ?SplitRule
    {
        return $this->createQueryBuilder('r')
            ->addSelect('e', 'm')
            ->leftJoin('r.entries', 'e')
            ->leftJoin('e.member', 'm')
            ->andWhere('r.board = :board')
            ->andWhere('r.item IS NULL')
            ->andWhere('r.effectiveFrom <= :period')
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->setParameter('period', $period, PeriodType::NAME)
            ->orderBy('r.effectiveFrom', 'DESC')
            ->addOrderBy('r.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Règles qui commencent exactement en $period (seules remplaçables).
     *
     * @return list<SplitRule>
     */
    public function findStartingAt(Board $board, ?BudgetItem $item, Period $period): array
    {
        $qb = $this->createQueryBuilder('r')
            ->andWhere('r.board = :board')
            ->andWhere('r.effectiveFrom = :period')
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->setParameter('period', $period, PeriodType::NAME);

        if ($item === null) {
            $qb->andWhere('r.item IS NULL');
        } else {
            $qb->andWhere('r.item = :item')->setParameter('item', $item->getId(), UuidType::NAME);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Remplace les règles du même mois par $rule dans une transaction.
     *
     * @param list<SplitRule> $previous
     */
    public function replace(array $previous, SplitRule $rule): void
    {
        $em = $this->getEntityManager();

        $em->wrapInTransaction(static function () use ($em, $previous, $rule): void {
            foreach ($previous as $old) {
                $em->remove($old);
            }

            $em->persist($rule);
            $em->flush();
        });
    }

    /**
     * Entité immuable (entrées persistées en cascade) : la date de création est fixée par le constructeur.
     */
    public function save(SplitRule $rule, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($rule);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(SplitRule $rule, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($rule);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
