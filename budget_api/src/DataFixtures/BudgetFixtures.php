<?php

namespace App\DataFixtures;

use App\Calculator\Adjustment\AmountAdjustment;
use App\Calculator\Allocation\OnDueAllocation;
use App\Calculator\Allocation\SmoothedAllocation;
use App\Calculator\Link\ShareRollupLink;
use App\Calculator\Recurrence\IntervalRecurrence;
use App\Calculator\Recurrence\OneOffRecurrence;
use App\Calculator\Split\EqualsSplit;
use App\Calculator\Split\PercentageSplit;
use App\Entity\Board;
use App\Entity\BoardLink;
use App\Entity\BoardMember;
use App\Entity\BudgetItem;
use App\Entity\BudgetItemAdjustment;
use App\Entity\BudgetItemRevision;
use App\Entity\Embeddable\Money;
use App\Entity\Expense;
use App\Entity\Invitation;
use App\Entity\SplitRule;
use App\Entity\Tag;
use App\Entity\User;
use App\Enum\Budget\BoardTypeEnum;
use App\Enum\Budget\ColorEnum;
use App\Enum\Budget\InvitationChannelEnum;
use App\Enum\Budget\ItemKindEnum;
use App\Enum\Budget\MemberRoleEnum;
use App\Service\Budget\BoardFactory;
use App\ValueObject\Period;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;

/**
 * Données de démonstration, reprises de l'exemple chiffré des spécifications. En octobre 2026 :
 * « Appartement » = 1 710,00 € (part de test@example.com : 855,00 €), revenus 2 800,00 €,
 * charges 1 002,80 €, épargne 400,00 €, reste à vivre 1 397,20 €, taux de charges 35,8 %.
 *
 * Invitation en attente de Camille : jeton en clair BudgetFixtures::INVITATION_TOKEN
 * (GET /api/invitations/{token}).
 */
class BudgetFixtures extends Fixture implements DependentFixtureInterface
{
    public const INVITATION_TOKEN = 'invitation-camille-appartement';
    private const CURRENCY = 'EUR';

    public function getDependencies(): array
    {
        return [AppFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        $testUser = $this->getReference(AppFixtures::TEST_USER, User::class);
        $adminUser = $this->getReference(AppFixtures::ADMIN_USER, User::class);

        $personalBoard = $this->loadTestPersonalBoard($manager, $testUser);
        $this->loadSharedApartment($manager, $testUser, $personalBoard);
        $this->loadHolidayGroup($manager, $testUser);

        $adminBoard = $this->createBoard($manager, $adminUser, BoardTypeEnum::Personal->value, BoardFactory::PERSONAL_BOARD_NAME)[0];
        $this->revise($manager, $this->createItem($manager, $adminBoard, ItemKindEnum::Income, 'Salaire', 0), '2026-01', 350000, dueDay: 28);

        $this->loadOtherUsers($manager, [$testUser, $adminUser]);

        $manager->flush();
    }

    /**
     * Revenus 2 800 €, charges perso 147,80 €, épargne 400 €, et une salle de sport désactivée (simulation).
     */
    private function loadTestPersonalBoard(ObjectManager $manager, User $user): Board
    {
        [$board] = $this->createBoard($manager, $user, BoardTypeEnum::Personal->value, BoardFactory::PERSONAL_BOARD_NAME);

        $income = $this->createTag($manager, ColorEnum::Green, 'Revenus', owner: $user);
        $transport = $this->createTag($manager, ColorEnum::Orange, 'Transport', owner: $user);
        $subscriptions = $this->createTag($manager, ColorEnum::Purple, 'Abonnements', owner: $user);
        $savings = $this->createTag($manager, ColorEnum::Yellow, 'Épargne', owner: $user);
        $leisure = $this->createTag($manager, ColorEnum::Pink, 'Loisirs', owner: $user);
        $gifts = $this->createTag($manager, ColorEnum::Red, 'Cadeaux', owner: $user);

        $salary = $this->createItem($manager, $board, ItemKindEnum::Income, 'Salaire', 0, $user, [$income]);
        $this->revise($manager, $salary, '2026-01', 280000, dueDay: 28);

        $navigo = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Pass Navigo', 1, $user, [$transport]);
        $this->revise($manager, $navigo, '2026-01', 9080, dueDay: 5);

        $mobile = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Forfait mobile', 2, $user, [$subscriptions]);
        $this->revise($manager, $mobile, '2026-01', 1200, dueDay: 12);

        $carInsurance = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Assurance auto', 3, $user, [$transport]);
        $this->revise($manager, $carInsurance, '2026-01', 4500, dueDay: 10);

        // Salle de sport de septembre à juin, désactivée pour tester le budget sans elle
        $gym = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Salle de sport', 4, $user, [$leisure], isActive: false);
        $this->revise($manager, $gym, '2026-09', 3500, endPeriod: '2027-06', dueDay: 3);

        // Ponctuel : startMonth = endMonth
        $christmas = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Cadeaux de Noël', 5, $user, [$gifts]);
        $this->revise($manager, $christmas, '2026-12', 15000, recurrenceType: OneOffRecurrence::CODE, params: []);

        $livretA = $this->createItem($manager, $board, ItemKindEnum::Savings, 'Livret A', 6, $user, [$savings]);
        $this->revise($manager, $livretA, '2026-01', 40000, dueDay: 1);

        return $board;
    }

    /**
     * Board partagé 50/50 avec Camille (invitée, invitation en attente) : 1 710 € en octobre 2026.
     */
    private function loadSharedApartment(ObjectManager $manager, User $user, Board $personalBoard): void
    {
        [$board, $owner, $guests] = $this->createBoard($manager, $user, BoardTypeEnum::Shared->value, 'Appartement', ['Camille']);
        $camille = $guests[0]->markInvited();

        $housing = $this->createTag($manager, ColorEnum::Blue, 'Logement', ownerBoard: $board);
        $groceries = $this->createTag($manager, ColorEnum::Green, 'Alimentation', ownerBoard: $board);
        $energy = $this->createTag($manager, ColorEnum::Amber, 'Énergie', ownerBoard: $board);
        $subscriptions = $this->createTag($manager, ColorEnum::Purple, 'Abonnements', ownerBoard: $board);
        $insurance = $this->createTag($manager, ColorEnum::Teal, 'Assurances', ownerBoard: $board);

        // Le loyer augmente en juillet : une nouvelle révision, les mois passés restent justes
        $rent = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Loyer', 0, $user, [$housing]);
        $this->revise($manager, $rent, '2026-01', 115000, dueDay: 5);
        $this->revise($manager, $rent, '2026-07', 117000, dueDay: 5);

        $groceriesItem = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Courses', 1, $user, [$groceries]);
        $this->revise($manager, $groceriesItem, '2026-01', 45000);

        $internet = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Internet', 2, $user, [$subscriptions]);
        $this->revise($manager, $internet, '2026-01', 3500, dueDay: 15, paidBy: $owner);

        // 180 €/an lissés : 15 €/mois (aligne le point « assurance habitation » des spécifications)
        $homeInsurance = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Assurance habitation', 3, $user, [$insurance]);
        $this->revise($manager, $homeInsurance, '2026-01', 18000, params: ['interval' => 12], allocation: SmoothedAllocation::CODE, dueDay: 15);

        $streaming = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Streaming', 4, $user, [$subscriptions]);
        $this->revise($manager, $streaming, '2026-01', 4000, dueDay: 20, paidBy: $camille);

        // 85 € tous les 2 mois depuis janvier (pas d'échéance en octobre), facture réelle de mars à 97,40 €
        $electricity = $this->createItem($manager, $board, ItemKindEnum::Expense, 'Électricité', 5, $user, [$energy]);
        $this->revise($manager, $electricity, '2026-01', 8500, params: ['interval' => 2, 'variable' => true], dueDay: 18);
        $manager->persist(new BudgetItemAdjustment(
            item: $electricity,
            period: Period::fromString('2026-03'),
            type: AmountAdjustment::CODE,
            amountCents: 9740,
            note: 'Facture réelle de mars',
            createdBy: $user,
        ));

        // Répartition du board : parts égales ; les courses passeront à 60/40 en 2027
        $manager->persist(new SplitRule($board, Period::fromString('2026-01'), EqualsSplit::CODE, createdBy: $user));
        $groceriesRule = new SplitRule($board, Period::fromString('2027-01'), PercentageSplit::CODE, $groceriesItem, $user);
        $groceriesRule->addEntry($owner, 6000)->addEntry($camille, 4000);
        $manager->persist($groceriesRule);

        // La part du propriétaire remonte dans son board perso
        $manager->persist((new BoardLink())
            ->setSourceBoard($board)
            ->setTargetBoard($personalBoard)
            ->setMember($owner)
            ->setType(ShareRollupLink::CODE)
            ->setActiveFrom(Period::fromString('2026-01')));

        $manager->persist((new Invitation())
            ->setBoard($board)
            ->setMember($camille)
            ->setInvitedBy($user)
            ->setEmail('camille@example.com')
            ->setChannel(InvitationChannelEnum::Email)
            ->setTokenHash(Invitation::hashToken(self::INVITATION_TOKEN))
            ->setExpiresAt(new \DateTimeImmutable('+7 days')));
    }

    /**
     * Groupe de dépenses à 3, tout partagé à parts égales (840 €, soit 280 € chacun) :
     * virements proposés Alex -> Test 190 €, puis Camille -> Test 130 €.
     */
    private function loadHolidayGroup(ObjectManager $manager, User $user): void
    {
        [$group, $owner, [$camille, $alex]] = $this->createBoard($manager, $user, BoardTypeEnum::ExpenseGroup->value, 'Vacances Biarritz', ['Camille', 'Alex']);
        $participants = [$owner, $camille, $alex];

        foreach ([
            ['Location', 60000, '2026-08-03', $owner],
            ['Courses', 15000, '2026-08-04', $camille],
            ['Restaurant', 9000, '2026-08-05', $alex],
        ] as [$label, $amountCents, $spentOn, $payer]) {
            $expense = new Expense(
                board: $group,
                paidBy: $payer,
                label: $label,
                amount: Money::of($amountCents, self::CURRENCY),
                spentOn: new \DateTimeImmutable($spentOn),
                splitStrategy: EqualsSplit::CODE,
                createdBy: $user,
            );

            foreach ($participants as $participant) {
                $expense->addShare($participant, intdiv($amountCents, count($participants)));
            }

            $manager->persist($expense);
        }
    }

    /**
     * Un board perso simple pour chaque autre utilisateur (salaire, loyer, courses).
     *
     * @param list<User> $exclude
     */
    private function loadOtherUsers(ObjectManager $manager, array $exclude): void
    {
        $faker = Factory::create('fr_FR');
        $excludedIds = array_map(static fn (User $user): string => (string) $user->getId(), $exclude);

        foreach ($manager->getRepository(User::class)->findAll() as $user) {
            if (in_array((string) $user->getId(), $excludedIds, true)) {
                continue;
            }

            [$board] = $this->createBoard($manager, $user, BoardTypeEnum::Personal->value, BoardFactory::PERSONAL_BOARD_NAME);

            $this->revise($manager, $this->createItem($manager, $board, ItemKindEnum::Income, 'Salaire', 0, $user), '2026-01', $faker->numberBetween(1800, 4200) * 100, dueDay: 28);
            $this->revise($manager, $this->createItem($manager, $board, ItemKindEnum::Expense, 'Loyer', 1, $user), '2026-01', $faker->numberBetween(600, 1300) * 100, dueDay: 5);
            $this->revise($manager, $this->createItem($manager, $board, ItemKindEnum::Expense, 'Courses', 2, $user), '2026-01', $faker->numberBetween(200, 500) * 100);
        }
    }

    /**
     * @param list<string> $guestNames
     *
     * @return array{0: Board, 1: BoardMember, 2: list<BoardMember>}
     */
    private function createBoard(ObjectManager $manager, User $owner, string $type, string $name, array $guestNames = []): array
    {
        $now = new \DateTimeImmutable();
        $board = (new Board())
            ->setOwner($owner)
            ->setType($type)
            ->setName($name)
            ->setCurrency(self::CURRENCY)
            ->setSettings(['rollupDisplay' => 'grouped']);

        $ownerMember = (new BoardMember())
            ->setBoard($board)
            ->setDisplayName(BoardFactory::displayNameOf($owner))
            ->setRole(MemberRoleEnum::Owner)
            ->attachUser($owner)
            ->activate($now);

        $guests = [];
        foreach ($guestNames as $guestName) {
            $guests[] = (new BoardMember())
                ->setBoard($board)
                ->setDisplayName($guestName)
                ->setRole(MemberRoleEnum::Editor)
                ->activate($now);
        }

        $manager->persist($board);

        return [$board, $ownerMember, $guests];
    }

    /**
     * @param list<Tag> $tags
     */
    private function createItem(
        ObjectManager $manager,
        Board $board,
        ItemKindEnum $kind,
        string $label,
        int $position,
        ?User $createdBy = null,
        array $tags = [],
        bool $isActive = true,
    ): BudgetItem {
        $item = (new BudgetItem())
            ->setBoard($board)
            ->setKind($kind)
            ->setLabel($label)
            ->setPosition($position)
            ->setIsActive($isActive)
            ->setCreatedBy($createdBy)
            ->syncTags($tags);

        $manager->persist($item);

        return $item;
    }

    /**
     * @param array<string, mixed> $params
     */
    private function revise(
        ObjectManager $manager,
        BudgetItem $item,
        string $from,
        int $amountCents,
        string $recurrenceType = IntervalRecurrence::CODE,
        array $params = ['interval' => 1],
        string $allocation = OnDueAllocation::CODE,
        ?string $endPeriod = null,
        ?int $dueDay = null,
        ?BoardMember $paidBy = null,
    ): BudgetItemRevision {
        if ($recurrenceType === IntervalRecurrence::CODE) {
            $params['anchor'] ??= '2026-01';
        }

        $effectiveFrom = Period::fromString($from);
        $revision = new BudgetItemRevision(
            item: $item,
            effectiveFrom: $effectiveFrom,
            amount: Money::of($amountCents, self::CURRENCY),
            recurrenceType: $recurrenceType,
            recurrenceParams: $params,
            allocation: $allocation,
            endPeriod: $recurrenceType === OneOffRecurrence::CODE ? $effectiveFrom : ($endPeriod !== null ? Period::fromString($endPeriod) : null),
            dueDay: $dueDay,
            paidBy: $paidBy,
            createdBy: $item->getCreatedBy(),
        );

        $item->addRevision($revision);
        $manager->persist($revision);

        return $revision;
    }

    private function createTag(ObjectManager $manager, ColorEnum $color, string $name, ?User $owner = null, ?Board $ownerBoard = null): Tag
    {
        $tag = (new Tag($owner, $ownerBoard))->setName($name)->setColor($color);
        $manager->persist($tag);

        return $tag;
    }
}
