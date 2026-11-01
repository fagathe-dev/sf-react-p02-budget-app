<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\Expense;
use App\Entity\ExpenseShare;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<Expense>
 */
class ExpenseRepository extends ServiceEntityRepository
{
    use SumByMemberTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Expense::class);
    }

    /**
     * Dépenses non annulées du groupe, filtrables par date, tag et payeur.
     *
     * @return list<Expense>
     */
    public function findForGroup(
        Board $group,
        ?\DateTimeImmutable $from = null,
        ?\DateTimeImmutable $to = null,
        ?string $tagId = null,
        ?string $paidByMemberId = null,
    ): array {
        $qb = $this->createQueryBuilder('e')
            ->addSelect('s')
            ->leftJoin('e.shares', 's')
            ->andWhere('e.board = :group')
            ->andWhere('e.voidedAt IS NULL')
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->orderBy('e.spentOn', 'DESC')
            ->addOrderBy('e.createdAt', 'DESC');

        if ($from !== null) {
            $qb->andWhere('e.spentOn >= :from')->setParameter('from', $from, Types::DATE_IMMUTABLE);
        }

        if ($to !== null) {
            $qb->andWhere('e.spentOn <= :to')->setParameter('to', $to, Types::DATE_IMMUTABLE);
        }

        if ($tagId !== null) {
            $qb->andWhere('e.tag = :tag')->setParameter('tag', $tagId, UuidType::NAME);
        }

        if ($paidByMemberId !== null) {
            $qb->andWhere('e.paidBy = :payer')->setParameter('payer', $paidByMemberId, UuidType::NAME);
        }

        return $qb->getQuery()->getResult();
    }

    public function findOneInGroup(Board $group, string $expenseId): ?Expense
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.id = :id')
            ->andWhere('e.board = :group')
            ->setParameter('id', $expenseId, UuidType::NAME)
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Total payé par chaque participant (dépenses annulées exclues).
     *
     * @return array<string, int>
     */
    public function sumPaidByMember(Board $group): array
    {
        return $this->indexSumsByMember($this->createQueryBuilder('e')
            ->select('m.id AS memberId', 'SUM(e.amount.amountCents) AS total')
            ->innerJoin('e.paidBy', 'm')
            ->andWhere('e.board = :group')
            ->andWhere('e.voidedAt IS NULL')
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->groupBy('m.id')
            ->getQuery()
            ->getArrayResult());
    }

    /**
     * Total des parts de chaque participant (dépenses annulées exclues).
     *
     * @return array<string, int>
     */
    public function sumSharesByMember(Board $group): array
    {
        return $this->indexSumsByMember($this->getEntityManager()->createQueryBuilder()
            ->select('m.id AS memberId', 'SUM(s.amountCents) AS total')
            ->from(ExpenseShare::class, 's')
            ->innerJoin('s.expense', 'e')
            ->innerJoin('s.member', 'm')
            ->andWhere('e.board = :group')
            ->andWhere('e.voidedAt IS NULL')
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->groupBy('m.id')
            ->getQuery()
            ->getArrayResult());
    }

    public function totalSpent(Board $group): int
    {
        return (int) $this->createQueryBuilder('e')
            ->select('COALESCE(SUM(e.amount.amountCents), 0)')
            ->andWhere('e.board = :group')
            ->andWhere('e.voidedAt IS NULL')
            ->setParameter('group', $group->getId(), UuidType::NAME)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Correction : la nouvelle dépense et l'annulation de l'ancienne partent dans le même flush (une transaction).
     */
    public function supersede(Expense $previous, Expense $replacement, \DateTimeImmutable $now): void
    {
        $previous->void($now);
        $this->getEntityManager()->persist($replacement);
        $this->getEntityManager()->flush();
    }

    /**
     * Seule voidedAt évolue après l'enregistrement : pas de date de mise à jour.
     */
    public function save(Expense $expense, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->persist($expense);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(Expense $expense, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($expense);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
