<?php

namespace App\Repository;

use App\Doctrine\Type\PeriodType;
use App\Entity\Board;
use App\Entity\BudgetItem;
use App\Entity\BudgetItemAdjustment;
use App\ValueObject\Period;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<BudgetItemAdjustment>
 */
class BudgetItemAdjustmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BudgetItemAdjustment::class);
    }

    public function findOneByItemAndPeriod(BudgetItem $item, Period $period): ?BudgetItemAdjustment
    {
        return $this->findOneBy(['item' => $item, 'period' => $period]);
    }

    /**
     * Exceptions du mois pour tout le board, indexées par identifiant de poste (une requête).
     *
     * @return array<string, BudgetItemAdjustment>
     */
    public function findIndexedByItem(Board $board, Period $period): array
    {
        $adjustments = $this->createQueryBuilder('a')
            ->innerJoin('a.item', 'i')
            ->andWhere('i.board = :board')
            ->andWhere('a.period = :period')
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->setParameter('period', $period, PeriodType::NAME)
            ->getQuery()
            ->getResult();

        $indexed = [];
        foreach ($adjustments as $adjustment) {
            $indexed[(string) $adjustment->getItem()->getId()] = $adjustment;
        }

        return $indexed;
    }

    /**
     * Remplace l'exception du mois dans une transaction (suppression flushée avant l'insertion,
     * contrainte unique [item_id, period]).
     */
    public function replace(?BudgetItemAdjustment $previous, BudgetItemAdjustment $adjustment): void
    {
        $em = $this->getEntityManager();

        $em->wrapInTransaction(static function () use ($em, $previous, $adjustment): void {
            if ($previous !== null) {
                $em->remove($previous);
                $em->flush();
            }

            $em->persist($adjustment);
            $em->flush();
        });
    }

    /**
     * Entité immuable : la date de création est fixée par le constructeur.
     */
    public function save(BudgetItemAdjustment $adjustment, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($adjustment);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(BudgetItemAdjustment $adjustment, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($adjustment);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
