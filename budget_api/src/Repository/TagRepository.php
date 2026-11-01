<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\Tag;
use App\Entity\User;
use App\Enum\Budget\ColorEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\Persistence\ManagerRegistry;
use Fagathe\CorePhp\Trait\DatetimeTrait;
use Symfony\Bridge\Doctrine\Types\UuidType;

/**
 * @extends ServiceEntityRepository<Tag>
 */
class TagRepository extends ServiceEntityRepository
{
    use DatetimeTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tag::class);
    }

    /**
     * @return list<Tag>
     */
    public function findByOwner(User $user): array
    {
        return $this->findBy(['owner' => $user], ['name' => 'ASC']);
    }

    /**
     * @return list<Tag>
     */
    public function findByBoard(Board $board): array
    {
        return $this->findBy(['ownerBoard' => $board], ['name' => 'ASC']);
    }

    public function countForOwner(User|Board $owner): int
    {
        return $this->count([$owner instanceof User ? 'owner' : 'ownerBoard' => $owner]);
    }

    public function findOneByOwnerAndColor(User|Board $owner, ColorEnum $color): ?Tag
    {
        return $this->findOneBy([$owner instanceof User ? 'owner' : 'ownerBoard' => $owner, 'color' => $color]);
    }

    /**
     * Tags utilisables sur un poste de $board : ceux de l'utilisateur et ceux du board.
     *
     * @param list<string> $ids
     *
     * @return list<Tag>
     */
    public function findUsable(array $ids, User $user, Board $board): array
    {
        if ($ids === []) {
            return [];
        }

        $qb = $this->createQueryBuilder('t')
            ->andWhere('t.owner = :user OR t.ownerBoard = :board')
            ->setParameter('user', $user->getId(), UuidType::NAME)
            ->setParameter('board', $board->getId(), UuidType::NAME);

        $placeholders = [];
        foreach (array_values($ids) as $index => $id) {
            $placeholders[] = ':id' . $index;
            $qb->setParameter('id' . $index, $id, UuidType::NAME);
        }

        return $qb->andWhere(sprintf('t.id IN (%s)', implode(', ', $placeholders)))
            ->getQuery()
            ->getResult();
    }

    public function save(Tag $tag, bool $flush = true, bool $isCreation = false): bool
    {
        $now = $this->now();

        if ($isCreation && $tag->getCreatedAt() === null) {
            $tag->setCreatedAt($now);
        }

        if (!$isCreation) {
            $tag->setUpdatedAt($now);
        }

        try {
            $this->getEntityManager()->persist($tag);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }

    public function remove(Tag $tag, bool $flush = true): bool
    {
        try {
            $this->getEntityManager()->remove($tag);

            if ($flush) {
                $this->getEntityManager()->flush();
            }

            return true;
        } catch (ORMException) {
            return false;
        }
    }
}
