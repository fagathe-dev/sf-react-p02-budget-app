<?php

namespace App\Repository;

use App\Entity\BudgetItemTag;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BudgetItemTag>
 */
class BudgetItemTagRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BudgetItemTag::class);
    }

    /**
     * Liaison immuable : la date de création est fixée par le constructeur.
     */
    public function save(BudgetItemTag $itemTag, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($itemTag);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(BudgetItemTag $itemTag, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($itemTag);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
