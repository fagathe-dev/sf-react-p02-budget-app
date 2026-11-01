<?php

namespace App\Repository;

use App\Entity\DomainEvent;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<DomainEvent>
 */
class DomainEventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DomainEvent::class);
    }

    /**
     * Historique d'un agrégat, du plus récent au plus ancien.
     *
     * @return list<DomainEvent>
     */
    public function findForAggregate(string $aggregateType, Uuid $aggregateId, int $limit = 50): array
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.aggregateType = :type')
            ->andWhere('e.aggregateId = :id')
            ->setParameter('type', $aggregateType)
            ->setParameter('id', $aggregateId, UuidType::NAME)
            ->orderBy('e.occurredAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Journal en ajout seul : la date est fixée par le constructeur.
     */
    public function save(DomainEvent $event, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($event);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(DomainEvent $event, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($event);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
