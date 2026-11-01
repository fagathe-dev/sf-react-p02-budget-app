<?php

namespace App\Repository;

use App\Entity\SplitRuleEntry;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SplitRuleEntry>
 */
class SplitRuleEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SplitRuleEntry::class);
    }

    /**
     * Entité immuable, en général persistée en cascade depuis SplitRule.
     */
    public function save(SplitRuleEntry $entry, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($entry);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(SplitRuleEntry $entry, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($entry);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
