<?php

namespace App\Repository;

use App\Entity\ExpenseShare;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ExpenseShare>
 */
class ExpenseShareRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ExpenseShare::class);
    }

    /**
     * Part figée, en général persistée en cascade depuis Expense.
     */
    public function save(ExpenseShare $share, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($share);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(ExpenseShare $share, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($share);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
