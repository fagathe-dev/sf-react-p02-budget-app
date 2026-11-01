<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\BudgetItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<BudgetItem>
 */
class BudgetItemRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BudgetItem::class);
    }

    /**
     * Postes non archivés du board, avec révisions et tags chargés en une requête (pas de N+1 au calcul).
     *
     * @return list<BudgetItem>
     */
    public function findForCalculation(Board $board): array
    {
        return $this->createQueryBuilder('i')
            ->addSelect('r', 'it', 't')
            ->leftJoin('i.revisions', 'r')
            ->leftJoin('i.itemTags', 'it')
            ->leftJoin('it.tag', 't')
            ->andWhere('i.board = :board')
            ->andWhere('i.archivedAt IS NULL')
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->orderBy('i.position', 'ASC')
            ->addOrderBy('i.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneInBoard(Board $board, string $itemId): ?BudgetItem
    {
        return $this->createQueryBuilder('i')
            ->addSelect('r')
            ->leftJoin('i.revisions', 'r')
            ->andWhere('i.id = :id')
            ->andWhere('i.board = :board')
            ->andWhere('i.archivedAt IS NULL')
            ->setParameter('id', $itemId, UuidType::NAME)
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function nextPosition(Board $board): int
    {
        $max = $this->createQueryBuilder('i')
            ->select('MAX(i.position)')
            ->andWhere('i.board = :board')
            ->setParameter('board', $board->getId(), UuidType::NAME)
            ->getQuery()
            ->getSingleScalarResult();

        return $max === null ? 0 : (int) $max + 1;
    }

    public function save(BudgetItem $item, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $item->getCreatedAt() === null) {
            $item->setCreatedAt($now);
        }

        if (!$isCreation) {
            $item->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($item);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(BudgetItem $item, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($item);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
