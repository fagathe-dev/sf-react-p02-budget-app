<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\Settlement;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<Settlement>
 */
class SettlementRepository extends ServiceEntityRepository
{
    use SumByMemberTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Settlement::class);
    }

    /**
     * @return list<Settlement>
     */
    public function findForGroup(Board $group): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.board = :group')
            ->andWhere('s.voidedAt IS NULL')
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->orderBy('s.settledOn', 'DESC')
            ->addOrderBy('s.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneInGroup(Board $group, string $settlementId): ?Settlement
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.id = :id')
            ->andWhere('s.board = :group')
            ->setParameter('id', $settlementId, UuidType::NAME)
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Remboursements envoyés par chaque participant (annulés exclus).
     *
     * @return array<string, int>
     */
    public function sumSentByMember(Board $group): array
    {
        return $this->sumByMember($group, 'fromMember');
    }

    /**
     * Remboursements reçus par chaque participant (annulés exclus).
     *
     * @return array<string, int>
     */
    public function sumReceivedByMember(Board $group): array
    {
        return $this->sumByMember($group, 'toMember');
    }

    /**
     * Seule voidedAt évolue après l'enregistrement : pas de date de mise à jour.
     */
    public function save(Settlement $settlement, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($settlement);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(Settlement $settlement, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($settlement);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    /**
     * @return array<string, int>
     */
    private function sumByMember(Board $group, string $side): array
    {
        return $this->indexSumsByMember($this->createQueryBuilder('s')
            ->select('m.id AS memberId', 'SUM(s.amount.amountCents) AS total')
            ->innerJoin('s.' . $side, 'm')
            ->andWhere('s.board = :group')
            ->andWhere('s.voidedAt IS NULL')
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->groupBy('m.id')
            ->getQuery()
            ->getArrayResult());
    }
}
