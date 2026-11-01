<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\BoardMember;
use App\Entity\User;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\MemberStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<Board>
 */
class BoardRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Board::class);
    }

    /**
     * Board non archivé, avec ses membres (évite un N+1 dans le calcul des parts).
     */
    public function findActive(string $id): ?Board
    {
        return $this->createQueryBuilder('b')
            ->addSelect('m')
            ->leftJoin('b.members', 'm')
            ->andWhere('b.id = :id')
            ->andWhere('b.archivedAt IS NULL')
            ->setParameter('id', $id, UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Le board perso actif de l'utilisateur (un seul par utilisateur en V1).
     */
    public function findPersonalBoard(User $user): ?Board
    {
        return $this->createQueryBuilder('b')
            ->addSelect('m')
            ->leftJoin('b.members', 'm')
            ->andWhere('b.owner = :user')
            ->andWhere('b.type = :type')
            ->andWhere('b.archivedAt IS NULL')
            ->setParameter('user', $user->getId(), UuidType::NAME)
            ->setParameter('type', BoardTypeEnum::Personal->value)
            ->orderBy('b.createdAt', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Boards non archivés dont l'utilisateur est propriétaire ou membre non parti.
     *
     * @param list<string> $types
     *
     * @return list<Board>
     */
    public function findForUser(User $user, array $types = []): array
    {
        $memberBoards = $this->getEntityManager()->createQueryBuilder()
            ->select('IDENTITY(bm.board)')
            ->from(BoardMember::class, 'bm')
            ->andWhere('bm.user = :user')
            ->andWhere('bm.status != :left');

        $qb = $this->createQueryBuilder('b')
            ->addSelect('m')
            ->leftJoin('b.members', 'm')
            ->andWhere('b.archivedAt IS NULL')
            ->andWhere(sprintf('b.owner = :user OR b.id IN (%s)', $memberBoards->getDQL()))
            ->setParameter('user', $user->getId(), UuidType::NAME)
            ->setParameter('left', MemberStatusEnum::Left)
            ->orderBy('b.createdAt', 'ASC');

        if ($types !== []) {
            $qb->andWhere('b.type IN (:types)')->setParameter('types', $types);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Boards dont l'utilisateur est propriétaire (suppression du compte).
     *
     * @return list<Board>
     */
    public function findOwnedBy(User $user): array
    {
        return $this->findBy(['owner' => $user]);
    }

    public function save(Board $board, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $board->getCreatedAt() === null) {
            $board->setCreatedAt($now);
        }

        if (!$isCreation) {
            $board->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($board);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    /**
     * Supprime un board (cascade SQL sur ses membres, postes, règles et faits)
     * @param Board $board L'entité à supprimer
     * @param bool $flush Faut-il exécuter la requête tout de suite ?
     * @return bool Succès de l'opération
     */
    public function remove(Board $board, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($board);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
