# Conception Symfony — classes et séquences

Traduction du modèle de données en entités Doctrine et services Symfony, avec les diagrammes de classes et les séquences des fonctionnalités métier. Les noms suivent les conventions du socle : contrôleurs `final` sans logique, services sans `EntityManagerInterface`, persistance via `save()` et `remove()` des repositories.

## Organisation du code

Le métier vit dans un module `Budget` indépendant des contrôleurs, ce qui permet de le sortir plus tard dans un package partagé, comme `cms-core`.

```text
src/
├── Budget/
│   ├── Entity/           # Board, BoardMember, BudgetItem, BudgetItemRevision, BudgetItemAdjustment,
│   │                     # SplitRule, SplitRuleEntry, BoardLink, Tag, DomainEvent
│   ├── ValueObject/      # Period, Money (Embeddable)
│   ├── Enum/             # BoardType, ItemKind, MemberRole, MemberStatus, Allocation, …
│   ├── Repository/       # save() / remove() + requêtes d'agrégation
│   ├── Dto/              # entrées validées : CreateItemDto, ReviseItemDto, SetAdjustmentDto, InviteMemberDto
│   ├── Calculator/       # BoardCalculator + interfaces de stratégies et leurs implémentations
│   │   ├── Recurrence/   # IntervalRecurrence, SpecificMonthsRecurrence, OneOffRecurrence
│   │   ├── Allocation/   # OnDueAllocation, SmoothedAllocation
│   │   ├── Adjustment/   # ExcludeAdjustment, IncludeAdjustment, AmountAdjustment
│   │   ├── Split/        # EqualsSplit, AmountSplit, PercentageSplit
│   │   └── Link/         # ShareRollupLink
│   ├── Insight/          # InsightService + une classe par InsightRule
│   ├── Service/          # BoardService, ItemService, AdjustmentService, MembershipService
│   ├── Security/         # BoardVoter (VIEW, EDIT, MANAGE_MEMBERS)
│   ├── Event/            # UserActivated, ItemRevised, ItemAdjusted, MemberInvited, MemberJoined
│   └── EventListener/    # CreatePersonalBoard, DomainEventRecorder
└── Controller/Budget/    # BoardController, ItemController, AdjustmentController,
                          # MemberController, InsightController (final, sans logique)
```

| Composant Symfony | Usage dans l'app |
| --- | --- |
| `#[AutoconfigureTag]` + `#[AutowireLocator]` | Chaque stratégie s'enregistre sous son code (`interval`, `on_due`…) ; le calculateur la récupère par ce code |
| EventDispatcher | Événements métier (`ItemRevised`…) ; `DomainEventRecorder` les écrit dans le journal |
| Workflow (state machine) | Statut d'un membre : invited → active → left |
| Security Voter | `BoardVoter` : un membre ne voit que ses boards, seul le propriétaire gère les membres |
| Validator | DTO validés, puis paramètres JSON validés par la stratégie concernée |
| Messenger (lot 3) | Notifications envoyées en asynchrone à partir des événements |

## Mapping Doctrine

La règle clé : un **ensemble fermé** (type de poste, rôle, statut) devient un enum PHP ; un **ensemble ouvert** (récurrence, mode, répartition, type d'exception, de lien ou de board) reste un code texte validé par le registre des stratégies. Ajouter une stratégie ne modifie donc ni la base ni un enum existant.

| Besoin | Choix Doctrine | Pourquoi |
| --- | --- | --- |
| Identifiants | `UuidType`, `Uuid::v7()` dans le constructeur | Triables dans le temps, comme le socle |
| Montants | `#[ORM\Embeddable] Money` : `amount_cents` BIGINT + `currency` CHAR(3) | Aucun float ; la devise est déjà là pour le multi-devises |
| Périodes | Type DBAL `period` (DATE au 1er du mois) ↔ Value Object `Period` | Comparable en SQL ; impossible de stocker un « 15 du mois » par erreur |
| Ensembles fermés | Enum PHP backed + `enumType`, colonne VARCHAR(32) | Typé en PHP, pas d'ENUM SQL à migrer |
| Ensembles ouverts | `string` VARCHAR(32) + paramètres `json` | Nouvelle stratégie = nouvelle classe taguée |
| Faits (révision, exception, journal) | `readOnly: true`, constructeur complet, aucun setter | Doctrine n'émet jamais d'UPDATE sur ces lignes |
| Suppression | `archived_at` sur Board et BudgetItem | Les révisions et le journal gardent leurs références |

Les entités ne sont pas `final` (Doctrine a besoin de proxies pour le chargement différé) ; les services, handlers et contrôleurs le sont.

**Exemple : une révision, immuable par construction**

```php
#[ORM\Entity(repositoryClass: BudgetItemRevisionRepository::class, readOnly: true)]
#[ORM\UniqueConstraint(columns: ['item_id', 'effective_from'])]
class BudgetItemRevision
{
    #[ORM\Id, ORM\Column(type: UuidType::NAME)]
    private Uuid $id;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        #[ORM\ManyToOne(inversedBy: 'revisions'), ORM\JoinColumn(nullable: false)]
        private BudgetItem $item,
        #[ORM\Column(type: PeriodType::NAME)]
        private Period $effectiveFrom,
        #[ORM\Embedded(columnPrefix: false)]
        private Money $amount,
        #[ORM\Column(length: 32)]
        private string $recurrenceType,          // code ouvert : 'interval', 'specific_months', 'one_off'…
        #[ORM\Column(type: Types::JSON)]
        private array $recurrenceParams,         // ex. ['interval' => 2, 'anchor' => '2026-01']
        #[ORM\Column(length: 32)]
        private string $allocation,              // code ouvert : 'on_due', 'smoothed'
        #[ORM\Column(type: PeriodType::NAME, nullable: true)]
        private ?Period $endPeriod = null,
        #[ORM\Column(type: Types::SMALLINT, nullable: true)]
        private ?int $dueDay = null,
        #[ORM\ManyToOne]
        private ?BoardMember $paidBy = null,
    ) {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
    }

    // Uniquement des getters : une correction crée une nouvelle révision.
}
```

## Diagramme de classes — entités

Un `BudgetItem` décrit *quoi* ; ses révisions disent *combien et quand*, ses exceptions modifient un mois, et les règles de répartition disent *qui paie*. Les classes `readOnly` n'ont aucun setter.

```mermaid
classDiagram
    direction LR

    class User {
        +Uuid id
        +string email
        +string username
        +array settings
    }
    class Board {
        +Uuid id
        +string type
        +string name
        +string currency
        +array settings
        +DateTimeImmutable archivedAt
        +archive()
    }
    class BoardMember {
        +Uuid id
        +string displayName
        +MemberRole role
        +MemberStatus status
        +DateTimeImmutable joinedAt
        +DateTimeImmutable leftAt
    }
    class BudgetItem {
        +Uuid id
        +ItemKind kind
        +string label
        +int position
        +bool isActive
        +DateTimeImmutable archivedAt
        +revise(ReviseItemDto) BudgetItemRevision
    }
    class BudgetItemRevision {
        <<readOnly>>
        +Uuid id
        +Period effectiveFrom
        +Period endPeriod
        +Money amount
        +string recurrenceType
        +array recurrenceParams
        +string allocation
        +int dueDay
    }
    class BudgetItemAdjustment {
        <<readOnly>>
        +Uuid id
        +Period period
        +string type
        +Money amount
        +array params
        +string note
    }
    class SplitRule {
        <<readOnly>>
        +Uuid id
        +Period effectiveFrom
        +string strategy
    }
    class SplitRuleEntry {
        <<readOnly>>
        +int value
    }
    class BoardLink {
        +Uuid id
        +string type
        +array params
        +Period activeFrom
        +Period activeTo
    }
    class Invitation {
        +Uuid id
        +string email
        +string channel
        +string tokenHash
        +string status
        +DateTimeImmutable expiresAt
        +int maxUses
        +int useCount
        +DateTimeImmutable acceptedAt
        +accept(User user)
        +revoke()
    }
    class Tag {
        +Uuid id
        +string name
        +string color
    }
    class DomainEvent {
        <<readOnly>>
        +Uuid id
        +string aggregateType
        +Uuid aggregateId
        +string type
        +array payload
        +DateTimeImmutable occurredAt
    }
    class Money {
        <<Embeddable>>
        +int amountCents
        +string currency
    }
    class Period {
        <<ValueObject>>
        +DateTimeImmutable firstDay
        +next() Period
        +monthsSince(Period) int
    }

    User "1" --> "*" Board : possède
    Board "1" *-- "*" BoardMember
    BoardMember "*" --> "0..1" User : compte lié
    Board "1" *-- "*" BudgetItem
    BudgetItem "1" *-- "1..*" BudgetItemRevision : révisions datées
    BudgetItem "1" *-- "*" BudgetItemAdjustment : exceptions par mois
    BudgetItemRevision "*" --> "0..1" BoardMember : payé par
    Board "1" *-- "*" SplitRule
    SplitRule "*" --> "0..1" BudgetItem : propre au poste
    SplitRule "1" *-- "*" SplitRuleEntry
    SplitRuleEntry "*" --> "1" BoardMember
    BoardLink "*" --> "1" Board : source
    BoardLink "*" --> "1" Board : cible
    BoardLink "*" --> "0..1" BoardMember : via
    BudgetItem "*" --> "*" Tag
    Tag "*" --> "0..1" User : propriétaire
    Tag "*" --> "0..1" Board : propriétaire
    DomainEvent "*" --> "0..1" User : acteur
    Board "1" *-- "*" Invitation
    Invitation "*" --> "1" BoardMember : membre visé
    Invitation "*" --> "1" User : invité par
    Invitation "*" --> "0..1" User : acceptée par
    BudgetItemRevision ..> Money
    BudgetItemRevision ..> Period
    BudgetItemAdjustment ..> Money
```

**Contraintes en base :** unique `[board_id, user_id]` sur BoardMember, `[item_id, effective_from]` sur BudgetItemRevision, `[item_id, period]` sur BudgetItemAdjustment, `[split_rule_id, member_id]` sur SplitRuleEntry. Un tag a exactement un propriétaire, utilisateur ou board (contrainte CHECK).

## Diagramme de classes — calcul et extensions

`BoardCalculator` ne connaît que des interfaces. Chaque implémentation est un service `final` tagué par son code (`#[AsTaggedItem('interval')]`) et récupéré via `#[AutowireLocator]` : ajouter une stratégie revient à créer une classe, sans modifier le calculateur.

```mermaid
classDiagram
    direction TB

    class BoardCalculator {
        <<service final>>
        +calculate(Board board, Period period) BoardResult
    }
    class RevisionResolver {
        <<service final>>
        +resolve(BudgetItem item, Period period) BudgetItemRevision
    }
    class BalanceCalculator {
        <<service final>>
        +compute(array shares, array paidBy) Balance
    }
    class BoardResult {
        +Period period
        +array lines
        +array totals
        +array memberShares
        +Balance balance
    }

    class RecurrenceHandlerInterface {
        <<interface>>
        +isDue(BudgetItemRevision rev, Period period) bool
        +intervalMonths(BudgetItemRevision rev) int
        +validateParams(array params) ConstraintViolationList
    }
    class AllocationHandlerInterface {
        <<interface>>
        +amountFor(BudgetItemRevision rev, Period period, bool isDue) Money
    }
    class AdjustmentHandlerInterface {
        <<interface>>
        +apply(BudgetItemAdjustment adj, Money amount, bool isDue) Money
    }
    class SplitStrategyInterface {
        <<interface>>
        +split(Money amount, SplitRule rule, array members) array
    }
    class BoardLinkHandlerInterface {
        <<interface>>
        +contribute(BoardLink link, Period period) array
    }
    class InsightRuleInterface {
        <<interface>>
        +supports(InsightContext context) bool
        +evaluate(InsightContext context) array
    }

    BoardCalculator --> RevisionResolver
    BoardCalculator --> RecurrenceHandlerInterface : par recurrenceType
    BoardCalculator --> AllocationHandlerInterface : par allocation
    BoardCalculator --> AdjustmentHandlerInterface : par type
    BoardCalculator --> SplitStrategyInterface : par strategy
    BoardCalculator --> BoardLinkHandlerInterface : par type de lien
    BoardCalculator --> BalanceCalculator
    BoardCalculator ..> BoardResult : produit

    IntervalRecurrence ..|> RecurrenceHandlerInterface
    SpecificMonthsRecurrence ..|> RecurrenceHandlerInterface
    OneOffRecurrence ..|> RecurrenceHandlerInterface
    OnDueAllocation ..|> AllocationHandlerInterface
    SmoothedAllocation ..|> AllocationHandlerInterface
    ExcludeAdjustment ..|> AdjustmentHandlerInterface
    IncludeAdjustment ..|> AdjustmentHandlerInterface
    AmountAdjustment ..|> AdjustmentHandlerInterface
    EqualsSplit ..|> SplitStrategyInterface
    AmountSplit ..|> SplitStrategyInterface
    PercentageSplit ..|> SplitStrategyInterface
    ShareRollupLink ..|> BoardLinkHandlerInterface
    ShareRollupLink --> BoardCalculator : calcule le board source
    InsightService --> InsightRuleInterface : itère sur les règles taguées
    InsightService --> BoardCalculator
    NegativeRemainingRule ..|> InsightRuleInterface
    ChargesRatioRule ..|> InsightRuleInterface
    UpcomingLargeDueRule ..|> InsightRuleInterface
```

Un code inconnu (une valeur en base sans classe correspondante) lève une exception explicite du registre, plutôt que d'être ignoré silencieusement.

## Diagrammes de séquence

### 1. Activation du compte et création du board perso

Le board perso est créé par un listener d'événement, pas par `AuthService` : l'authentification reste indépendante du budget, et la création est idempotente.

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant R as React
    participant C as AuthController
    participant S as AuthService
    participant UR as UserRequestService
    participant ED as EventDispatcher
    participant L as CreatePersonalBoardListener
    participant BR as BoardRepository
    participant J as DomainEventRecorder

    U->>R: Ouvre le lien d'activation reçu par e-mail
    R->>C: POST /api/auth/verify-email {token}
    C->>S: verifyEmail(request)
    S->>UR: findValidRequest(token, EmailVerification)
    alt jeton invalide ou expiré
        UR-->>S: null
        S-->>C: 400 Lien invalide ou expiré
    else jeton valide
        UR-->>S: UserRequest
        S->>S: user.markVerified(now)
        S->>UR: consume(userRequest)
        S->>ED: dispatch(UserActivated)
        ED->>L: __invoke(UserActivated)
        L->>BR: findPersonalBoard(user)
        alt aucun board perso
            L->>BR: save(Board personal "Mon budget", isCreation true)
            L->>J: record(board.created)
        end
        S-->>C: 200 Compte activé
    end
    C-->>R: réponse JSON
```

### 2. Calcul d'un board partagé pour un mois

C'est le cœur de l'application : chaque étape délègue à la stratégie désignée par un code en base. Rien n'est stocké : les totaux sont recalculés à chaque lecture.

```mermaid
sequenceDiagram
    autonumber
    participant R as React
    participant C as BoardController
    participant V as BoardVoter
    participant S as BoardService
    participant K as BoardCalculator
    participant RR as RevisionResolver
    participant RH as RecurrenceHandler
    participant AH as AllocationHandler
    participant XH as AdjustmentHandler
    participant SS as SplitStrategy
    participant B as BalanceCalculator

    R->>C: GET /api/boards/{id}?month=2026-10
    C->>S: getBoard(request)
    S->>V: isGranted(VIEW, board)
    V-->>S: membre actif du board
    S->>K: calculate(board, Period 2026-10)
    loop chaque BudgetItem actif et non archivé
        K->>RR: resolve(item, period)
        RR-->>K: révision en vigueur ou null
        K->>RH: isDue(revision, period)
        RH-->>K: true ou false
        K->>AH: amountFor(revision, period, isDue)
        AH-->>K: Money du mois
        opt exception enregistrée pour ce mois
            K->>XH: apply(adjustment, amount, isDue)
            XH-->>K: Money ajusté
        end
        K->>SS: split(amount, règle du poste ou du board, membres)
        SS-->>K: part de chaque membre, somme = montant
    end
    K->>B: compute(parts, payeurs)
    B-->>K: versements et remboursements
    K-->>S: BoardResult
    S-->>C: sendJson(BoardResult, 200)
    C-->>R: total foyer, parts, équilibre
```

Les révisions, exceptions et règles du mois sont chargées en une requête par type avant la boucle, pour éviter les N+1.

### 3. Board perso et remontée des quotes-parts

La remontée n'est pas codée en dur : c'est un `BoardLink` de type `share_rollup`, traité par sa stratégie. Un autre type de lien (objectif d'épargne) suivra le même chemin.

```mermaid
sequenceDiagram
    autonumber
    participant R as React
    participant C as BoardController
    participant S as BoardService
    participant K as BoardCalculator
    participant LR as BoardLinkRepository
    participant LH as ShareRollupLink

    R->>C: GET /api/boards/{idPerso}?month=2026-10
    C->>S: getBoard(request)
    S->>K: calculate(boardPerso, period)
    K->>K: calcule revenus, charges perso et épargne (même pipeline)
    K->>LR: findActiveTargeting(boardPerso, period)
    LR-->>K: liens share_rollup actifs
    loop chaque BoardLink
        K->>LH: contribute(link, period)
        LH->>K: calculate(boardPartagé, period)
        Note over K,LH: résultat mémorisé pour la requête, et un board perso ne peut pas être source d'un lien, donc pas de cycle
        K-->>LH: BoardResult du board partagé
        LH-->>K: lignes de ma part, groupées ou détaillées selon les settings
    end
    K->>K: total charges, reste à vivre, taux de charges
    K-->>S: BoardResult
    S-->>C: sendJson(BoardResult, 200)
    C-->>R: board perso avec quotes-parts
```

### 4. Modifier un poste : nouvelle révision

Modifier un montant ou une fréquence ne met jamais à jour une ligne : une révision est créée à partir du mois choisi. Seule la révision du même mois peut être remplacée, et le journal garde l'avant et l'après.

```mermaid
sequenceDiagram
    autonumber
    participant R as React
    participant C as ItemController
    participant S as ItemService
    participant V as BoardVoter
    participant VL as Validator
    participant RH as RecurrenceHandler
    participant RV as BudgetItemRevisionRepository
    participant ED as EventDispatcher
    participant J as DomainEventRecorder
    participant K as BoardCalculator

    R->>C: PUT /api/boards/{id}/items/{itemId} {amount, recurrence, allocation, effectiveFrom}
    C->>S: revise(request)
    S->>V: isGranted(EDIT, board)
    S->>S: deserialize en ReviseItemDto
    S->>VL: validate(dto)
    alt violations
        VL-->>S: erreurs
        S-->>C: 422 sendViolations
    else DTO valide
        S->>RH: validateParams(recurrenceParams)
        S->>RV: findOneBy(item, effectiveFrom)
        opt une révision existe déjà pour ce mois
            S->>RV: remove(révision du mois)
        end
        S->>RV: save(new BudgetItemRevision, isCreation true)
        S->>ED: dispatch(ItemRevised avant et après)
        ED->>J: record(budget_item.revised)
        S->>K: calculate(board, effectiveFrom)
        S-->>C: 200 BoardResult
    end
    C-->>R: réponse JSON
```

### 5. Exception d'un mois

Exemple : la facture d'électricité de mars arrive à 97,40 € au lieu de 85 €. Le type d'exception (`amount`) désigne la stratégie qui valide et applique la correction.

```mermaid
sequenceDiagram
    autonumber
    participant R as React
    participant C as AdjustmentController
    participant S as AdjustmentService
    participant V as BoardVoter
    participant XH as AdjustmentHandler
    participant XR as BudgetItemAdjustmentRepository
    participant ED as EventDispatcher
    participant J as DomainEventRecorder
    participant K as BoardCalculator

    R->>C: PUT /api/boards/{id}/items/{itemId}/months/2026-03 {type amount, amount 9740}
    C->>S: setAdjustment(request)
    S->>V: isGranted(EDIT, board)
    S->>XH: validate(type, amount, params)
    S->>XR: findOneBy(item, period)
    opt une exception existe déjà ce mois
        S->>XR: remove(exception existante)
    end
    S->>XR: save(new BudgetItemAdjustment, isCreation true)
    S->>ED: dispatch(ItemAdjusted)
    ED->>J: record(budget_item.adjusted)
    S->>K: calculate(board, period)
    S-->>C: 200 BoardResult du mois
    C-->>R: ligne marquée exception, totaux à jour

    Note over R,C: Revenir à la règle = DELETE sur la même route, même journalisation
```

### 6. Inviter un membre et accepter l'invitation

L'invitation est portée par une entité dédiée, `Invitation`, commune aux boards partagés et aux groupes de dépenses puisque les deux sont des `Board`. Tant qu'elle n'est pas acceptée, le membre se comporte comme un invité local : sa part est calculée, mais rien ne remonte dans un board perso. Ce qui se passe à l'acceptation dépend du type de board, via son `BoardTypeHandler`.

```mermaid
sequenceDiagram
    autonumber
    actor O as Propriétaire
    actor P as Invité
    participant C as InvitationController
    participant S as InvitationService
    participant V as BoardVoter
    participant MR as BoardMemberRepository
    participant IR as InvitationRepository
    participant M as EmailDispatcherService
    participant WF as Workflow board_member
    participant BT as BoardTypeHandler
    participant J as DomainEventRecorder

    O->>C: POST /api/boards/{id}/invitations {email, memberId facultatif}
    C->>S: invite(request)
    S->>V: isGranted(MANAGE_MEMBERS, board)
    alt memberId fourni : invité local déjà présent
        S->>MR: find(memberId)
    else nouveau participant
        S->>MR: save(BoardMember status invited, displayName)
    end
    S->>S: génère un token aléatoire, ne garde que son hash
    S->>IR: save(Invitation pending, tokenHash, expiresAt, channel email)
    S->>M: send(BoardInvitationMailDto avec le lien et le token en clair)
    S->>J: record(board.member_invited)
    S-->>C: 201 invitation envoyée

    P->>C: POST /api/invitations/{token}/accept
    C->>S: accept(request)
    S->>IR: findPendingByTokenHash(hash du token)
    alt expirée, révoquée ou déjà utilisée
        S-->>C: 410 invitation invalide
    else valide
        S->>MR: member.attachUser(utilisateur connecté)
        S->>WF: apply(member, accept)
        S->>IR: save(invitation accepted, acceptedBy, acceptedAt)
        S->>BT: onMemberJoined(member) selon board.type
        Note over S,BT: board partagé = crée le BoardLink share_rollup, groupe de dépenses = rien au lot 2
        S->>J: record(board.member_joined)
        S-->>C: 200 membre actif
    end
```

**Pourquoi pas `UserRequest` ?** Dans le socle, `UserRequest` est lié à un compte existant et sert aux parcours d'authentification (vérification d'e-mail, mot de passe oublié). Une invitation doit pouvoir viser une adresse sans compte, porter le board et le membre concernés, et fonctionner en lien partageable à usages multiples (`channel` = link, `maxUses`) pour le lot 4. `UserRequest` reste donc réservé à l'authentification, sans nouveau type.

### 7. Insights de l'accueil

L'accueil réutilise le calculateur sur trois mois (le mois affiché et les deux suivants) pour détecter les grosses échéances. Chaque règle est une classe taguée, indépendante des autres.

```mermaid
sequenceDiagram
    autonumber
    participant R as React accueil
    participant C as InsightController
    participant S as InsightService
    participant BR as BoardRepository
    participant K as BoardCalculator
    participant IR as InsightRule taguée

    R->>C: GET /api/insights?month=2026-10
    C->>S: getInsights(user, period)
    S->>BR: findPersonalBoard(user)
    S->>K: calculate(boardPerso, period)
    S->>K: calculate(boardPerso, period + 1 et + 2)
    Note over S,K: projection pour les grosses échéances à venir
    S->>S: construit InsightContext (résultats, préférences, mois)
    loop chaque InsightRule taguée
        S->>IR: supports(context)
        opt règle concernée
            S->>IR: evaluate(context)
            IR-->>S: Insight key, level, message, link
        end
    end
    S->>S: trie par niveau puis par montant
    S-->>C: sendJson(kpis, insights, upcoming, sharedBoards)
    C-->>R: données de la page d'accueil
```

## Module ExpenseSplitter

Le module vit dans `src/ExpenseSplitter/` (entités `Expense`, `ExpenseShare`, `Settlement`, leurs services et contrôleurs). Il dépend du module `Budget` uniquement par ses interfaces et entités de structure, jamais l'inverse.

### Diagramme de classes

```mermaid
classDiagram
    direction LR

    class Board {
        +Uuid id
        +string type
        +string name
        +string currency
    }
    class BoardMember {
        +Uuid id
        +string displayName
    }
    class Expense {
        <<immutable sauf void>>
        +Uuid id
        +string label
        +Money amount
        +DateTimeImmutable spentOn
        +string splitStrategy
        +DateTimeImmutable voidedAt
        +isVoided() bool
    }
    class ExpenseShare {
        <<readOnly>>
        +Money amount
        +int inputValue
    }
    class Settlement {
        <<immutable sauf void>>
        +Uuid id
        +Money amount
        +DateTimeImmutable settledOn
        +string note
        +DateTimeImmutable voidedAt
    }
    class Tag
    class ExpenseService {
        <<service final>>
        +add(AddExpenseDto dto) Expense
        +correct(Expense old, AddExpenseDto dto) Expense
        +void(Expense expense)
    }
    class SettlementService {
        <<service final>>
        +record(RecordSettlementDto dto) Settlement
        +void(Settlement settlement)
    }
    class BalanceCalculator {
        <<service final>>
        +balances(Board group) array
        +plan(array balances) array
    }
    class SplitStrategyInterface {
        <<interface>>
        +split(Money amount, SplitRule rule, array members) array
    }

    Board "1" *-- "*" BoardMember
    Board "1" *-- "*" Expense
    Expense "*" --> "1" BoardMember : payé par
    Expense "1" *-- "1..*" ExpenseShare
    ExpenseShare "*" --> "1" BoardMember
    Expense "0..1" --> "0..1" Expense : remplace
    Expense "*" --> "0..1" Tag
    Board "1" *-- "*" Settlement
    Settlement "*" --> "1" BoardMember : de
    Settlement "*" --> "1" BoardMember : à
    ExpenseService --> SplitStrategyInterface : par splitStrategy
    ExpenseService ..> Expense : crée
    SettlementService ..> Settlement : crée
    BalanceCalculator ..> Expense : lit
    BalanceCalculator ..> Settlement : lit
```

`voidedAt` est la seule écriture autorisée sur une dépense ou un remboursement déjà enregistré : on ne supprime rien, pour que les soldes passés restent explicables. Pour que Doctrine l'accepte, ces deux entités ne sont pas en `readOnly` : l'immuabilité est garantie par l'absence de setters, sauf `void()`.

### Séquence 8 — Ajouter une dépense

La répartition est calculée par la même `SplitStrategy` que les boards, puis figée dans `ExpenseShare`.

```mermaid
sequenceDiagram
    autonumber
    participant R as React
    participant C as ExpenseController
    participant S as ExpenseService
    participant V as BoardVoter
    participant VL as Validator
    participant SS as SplitStrategy
    participant ER as ExpenseRepository
    participant ED as EventDispatcher
    participant J as DomainEventRecorder
    participant B as BalanceCalculator

    R->>C: POST /api/expense-groups/{id}/expenses {paidBy, amount, spentOn, label, participants, splitStrategy}
    C->>S: add(request)
    S->>V: isGranted(EDIT, group)
    S->>VL: validate(AddExpenseDto)
    Note over S,VL: payeur et participants membres du groupe, montant positif, devise du groupe
    alt violations
        S-->>C: 422 sendViolations
    else DTO valide
        S->>SS: split(amount, paramètres, participants)
        SS-->>S: part de chaque participant, somme = montant
        S->>ER: save(new Expense avec ses ExpenseShare, isCreation true)
        S->>ED: dispatch(ExpenseAdded)
        ED->>J: record(expense.added)
        S->>B: balances(group)
        B-->>S: soldes à jour
        S-->>C: 201 dépense et soldes
    end
    C-->>R: réponse JSON
```

Corriger une dépense suit le même chemin : la nouvelle dépense porte `supersedes_id`, l'ancienne reçoit `voidedAt`, dans la même transaction.

### Séquence 9 — Soldes et plan de virements

```mermaid
sequenceDiagram
    autonumber
    participant R as React
    participant C as ExpenseGroupController
    participant S as BalanceService
    participant V as BoardVoter
    participant ER as ExpenseRepository
    participant TR as SettlementRepository
    participant B as BalanceCalculator

    R->>C: GET /api/expense-groups/{id}/balances
    C->>S: getBalances(request)
    S->>V: isGranted(VIEW, group)
    S->>ER: sumPaidByMember(group)
    S->>ER: sumSharesByMember(group)
    Note over S,ER: dépenses annulées exclues, agrégats SQL GROUP BY
    S->>TR: sumSentAndReceivedByMember(group)
    S->>B: balances(payé, parts, envoyé, reçu)
    B-->>S: solde par participant, somme = 0
    S->>B: plan(soldes)
    loop tant qu'un solde n'est pas nul
        B->>B: plus gros créancier et plus gros débiteur, virement = le plus petit des deux montants
    end
    B-->>S: au plus n - 1 virements
    S-->>C: sendJson(balances, transfers)
    C-->>R: onglet Équilibres
```

### Séquence 10 — Enregistrer un remboursement

```mermaid
sequenceDiagram
    autonumber
    actor A as Alex
    participant R as React
    participant C as SettlementController
    participant S as SettlementService
    participant V as BoardVoter
    participant TR as SettlementRepository
    participant ED as EventDispatcher
    participant J as DomainEventRecorder
    participant B as BalanceCalculator

    A->>R: Clique « Marquer comme payé » sur Alex vers Frédérick, 190 €
    R->>C: POST /api/expense-groups/{id}/settlements {from, to, amount, settledOn}
    C->>S: record(request)
    S->>V: isGranted(EDIT, group)
    S->>S: vérifie from différent de to, montant positif, membres du groupe
    S->>TR: save(new Settlement, isCreation true)
    S->>ED: dispatch(SettlementRecorded)
    ED->>J: record(settlement.recorded)
    S->>B: balances(group) puis plan(soldes)
    B-->>S: soldes et virements restants
    S-->>C: 201 soldes à jour
    C-->>R: Alex à 0 €, reste Partenaire vers Frédérick 130 €

    Note over R,C: Annuler un remboursement = DELETE, qui renseigne voidedAt sans supprimer la ligne
```
