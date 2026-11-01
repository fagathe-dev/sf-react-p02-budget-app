<?php

namespace App\DataFixtures;

use App\Entity\User;
use App\Enum\Auth\RoleEnum;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public const TEST_USER = 'user.test';
    public const ADMIN_USER = 'user.admin';

    public function __construct(
        private readonly UserPasswordHasherInterface $hasher,
    ) {}

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        $defaultPassword = 'Password123!';

        for ($i = 0; $i < random_int(15, 30); $i++) {
            $user = new User();

            // Utilisateur fixe de test pour le premier compte
            if ($i === 0) {
                $user
                    ->setEmail('test@example.com')
                    ->setUsername('testuser')
                    ->setFirstname('Test')
                    ->setLastname('User')
                    ->setCreatedAt(new \DateTimeImmutable());
            } elseif ($i === 1) {
                // Administrateur fixe (accès à la prévisualisation des e-mails et aux logs)
                $user
                    ->setEmail('admin@example.com')
                    ->setUsername('admin')
                    ->setFirstname('Admin')
                    ->setLastname('User')
                    ->setCreatedAt(new \DateTimeImmutable());
            } else {
                $user
                    ->setEmail($faker->unique()->safeEmail())
                    ->setUsername(substr($faker->unique()->userName() . $i, 0, 30))
                    ->setFirstname($faker->firstName())
                    ->setLastname($faker->lastName())
                    ->setCreatedAt(\DateTimeImmutable::createFromMutable($faker->dateTimeBetween('-3 months', 'now')));
            }

            $user
                ->setRole($i === 1 ? RoleEnum::RoleAdmin : RoleEnum::RoleUser)
                ->setPassword($this->hasher->hashPassword($user, $defaultPassword))
                ->setIsVerified(true)
                ->setEmailVerifiedAt(new \DateTimeImmutable());

            $manager->persist($user);

            // Références utilisées par BudgetFixtures
            if ($i === 0) {
                $this->addReference(self::TEST_USER, $user);
            } elseif ($i === 1) {
                $this->addReference(self::ADMIN_USER, $user);
            }
        }

        $manager->flush();
    }
}
