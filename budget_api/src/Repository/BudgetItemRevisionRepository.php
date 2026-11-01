<?php

namespace App\Repository;

use App\Entity\BudgetItem;
use App\Entity\BudgetItemRevision;
use App\ValueObject\Period;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BudgetItemRevision>
 */
class BudgetItemRevisionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BudgetItemRevision::class);
    }

    public function findOneByItemAndPeriod(BudgetItem $item, Period $period): ?BudgetItemRevision
    {
        return $this->findOneBy(['item' => $item, 'effectiveFrom' => $period]);
    }

    /**
     * Remplace la révision du même mois (s'il y en a une) par $revision, dans une transaction.
     * La suppression est flushée avant l'insertion : Doctrine insère avant de supprimer,
     * ce qui violerait la contrainte unique [item_id, effective_from].
     */
    public function replace(?BudgetItemRevision $previous, BudgetItemRevision $revision): void
    {
        $em = $this->getEntityManager();

        $em->wrapInTransaction(static function () use ($em, $previous, $revision): void {
            if ($previous !== null) {
                $previous->getItem()->removeRevision($previous);
                $em->remove($previous);
                $em->flush();
            }

            $revision->getItem()->addRevision($revision);
            $em->persist($revision);
            $em->flush();
        });
    }

    /**
     * Entité immuable : la date de création est fixée par le constructeur.
     */
    public function save(BudgetItemRevision $revision, bool $flush = true): bool
    {
        try {
            $revision->getItem()->addRevision($revision);
            $this->getEntityManager()->persist($revision);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(BudgetItemRevision $revision, bool $flush = true): bool
    {
        try {
            $revision->getItem()->removeRevision($revision);
            $this->getEntityManager()->remove($revision);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
