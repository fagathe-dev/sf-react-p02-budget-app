# Module ExpenseSplitter — API

Compte rendu de ce qui a été développé dans `budget_api` pour les dépenses partagées. État au 28 octobre 2026.

Un groupe de dépenses fonctionne comme un Tricount : chacun saisit ce qu'il a payé (vacances, sorties), et l'application dit **qui doit combien à qui**, avec le moins de virements possible. Contrairement aux boards de budget, on enregistre ici des **dépenses réelles et datées**, pas des règles récurrentes.

Conventions (authentification, centimes, format des erreurs) et droits : voir [budget.md](budget.md#conventions-communes).

## En bref

- Un groupe est un `Board` de type `expense_group`. Ses participants sont des `BoardMember`, avec les mêmes invités locaux, invitations et droits (`BoardVoter`) que les boards partagés.
- La répartition d'une dépense passe par les mêmes stratégies que les boards (`equals`, `percentage`, `amount`), avec le même arrondi déterministe. Elle est ensuite **figée** dans `expense_share`.
- Rien n'est supprimé :
  - annuler pose `voidedAt` ;
  - corriger crée une nouvelle dépense qui remplace l'ancienne (`supersedesId`), elle-même annulée.
- Les soldes sont agrégés en SQL, puis `BalanceCalculator` propose le plan de virements.

## Modèle de données

| Table | Rôle | Écriture |
| --- | --- | --- |
| `board` (type `expense_group`) | Le groupe : nom, devise, propriétaire | Clôturé par archivage |
| `board_member` | Les participants | Voir [budget.md](budget.md#membres) |
| `expense` | Dépense : payeur, libellé, montant, date, mode de répartition, tag, dépense remplacée | **Immuable**, sauf `voided_at` |
| `expense_share` | Part figée de chaque participant (montant, valeur saisie) | **Immuable** |
| `settlement` | Remboursement d'un participant à un autre : montant, date, note | **Immuable**, sauf `voided_at` |

## Calcul des soldes

Pour chaque participant :

> solde = payé − parts dues + remboursements envoyés − remboursements reçus

Un solde positif signifie qu'on doit de l'argent au participant ; la somme des soldes vaut 0. Les dépenses et remboursements annulés sont exclus.

Plan de virements : à chaque étape, le plus gros débiteur rembourse le plus gros créancier, du plus petit des deux montants. On obtient au plus n − 1 virements ; à montant égal, l'ordre de création départage.

Répartition d'une dépense :

| `splitStrategy` | `participants[].value` | Contrôle |
| --- | --- | --- |
| `equals` | Ignorée | Au moins un participant |
| `percentage` | Points de base | Total exactement 10 000 |
| `amount` | Centimes | Somme exactement égale au montant de la dépense |

Les centimes d'arrondi vont au plus gros poids, puis au participant créé le premier : 100 € entre trois donnent 33,34 + 33,33 + 33,33. Seules les parts positives sont enregistrées.

## Endpoints

| Méthode et route | Droit | Corps | Réponse |
| --- | --- | --- | --- |
| `GET /api/expense-groups` | Connecté | — | 200 `{ groups }` |
| `POST /api/expense-groups` | Connecté | `CreateExpenseGroupDto` | 201 groupe détaillé |
| `GET /api/expense-groups/{id}` | `BOARD_VIEW` | — | 200 groupe détaillé |
| `PUT /api/expense-groups/{id}` | `BOARD_EDIT` | `UpdateExpenseGroupDto` | 200 groupe détaillé |
| `DELETE /api/expense-groups/{id}` | `BOARD_MANAGE_MEMBERS` | — | 204, clôture (archivage) |
| `GET /api/expense-groups/{id}/balances` | `BOARD_VIEW` | — | 200 soldes |
| `GET /api/expense-groups/{id}/expenses?from=&to=&tagId=&paidBy=` | `BOARD_VIEW` | — | 200 `{ expenses }`, dépenses annulées exclues |
| `POST /api/expense-groups/{id}/expenses` | `BOARD_EDIT` | `AddExpenseDto` | 201 `{ expense, …soldes }` |
| `PUT /api/expense-groups/{id}/expenses/{expenseId}` | `BOARD_EDIT` | `AddExpenseDto` | 200 `{ expense, …soldes }` : la correction remplace l'ancienne |
| `DELETE /api/expense-groups/{id}/expenses/{expenseId}` | `BOARD_EDIT` | — | 200 soldes ; 404 si déjà annulée |
| `GET /api/expense-groups/{id}/settlements` | `BOARD_VIEW` | — | 200 `{ settlements }` |
| `POST /api/expense-groups/{id}/settlements` | `BOARD_EDIT` | `RecordSettlementDto` | 201 `{ settlement, …soldes }` |
| `DELETE /api/expense-groups/{id}/settlements/{settlementId}` | `BOARD_EDIT` | — | 200 soldes ; 404 si déjà annulé |

Un identifiant qui ne désigne pas un groupe de dépenses (un board perso, par exemple) renvoie 404.

Pour les participants, on utilise les routes des boards :

- `POST`, `PUT` et `DELETE /api/boards/{id}/members` ;
- `POST /api/boards/{id}/invitations`.

Le groupe y est désigné par son identifiant de board.

```jsonc
// POST /api/expense-groups — CreateExpenseGroupDto
{
  "name": "Vacances Biarritz",
  "currency": "EUR",
  "participants": ["Camille", "Alex"]   // invités locaux, en plus du créateur
}

// PUT /api/expense-groups/{id} — UpdateExpenseGroupDto
{ "name": "Biarritz 2026" }

// POST /api/expense-groups/{id}/expenses — AddExpenseDto (même corps pour la correction)
{
  "paidByMemberId": "…",
  "amountCents": 9000,                 // strictement positif
  "spentOn": "2026-08-06",
  "label": "Glaces",
  "tagId": null,                       // tag personnel de l'auteur, ou tag du groupe
  "splitStrategy": "percentage",
  "participants": [
    { "memberId": "…", "value": 5000 },
    { "memberId": "…", "value": 3000 },
    { "memberId": "…", "value": 2000 }
  ]
}

// POST /api/expense-groups/{id}/settlements — RecordSettlementDto (« Marquer comme payé »)
{
  "fromMemberId": "…",                 // celui qui rembourse
  "toMemberId": "…",                   // différent de fromMemberId
  "amountCents": 19000,
  "settledOn": null,                   // aujourd'hui par défaut
  "note": "Virement Lydia"
}
```

Refus en 400 :

- payeur ou participant hors du groupe (ou parti) ;
- mode de répartition inconnu ;
- somme des pourcentages ou des montants fausse, avec le reste à répartir dans le message ;
- tag inutilisable ;
- filtre de date invalide ;
- remboursement vers soi-même.

## Réponses

Extraits réels des fixtures, listes réduites à un élément.

```jsonc
// GET /api/expense-groups
{
  "groups": [
    {
      "id": "…",
      "name": "Vacances Biarritz",
      "currency": "EUR",
      "memberCount": 3,
      "totalSpentCents": 84000,
      "myBalanceCents": 32000,
      "createdAt": "2026-10-27T23:12:44+01:00"
    }
  ]
}

// Groupe détaillé (GET /api/expense-groups/{id})
{
  "group": {
    "id": "…",
    "type": "expense_group",
    "name": "Vacances Biarritz",
    "currency": "EUR",
    "settings": { "rollupDisplay": "grouped" },
    "createdAt": "…",
    "updatedAt": null,
    "archivedAt": null
  },
  "members": [
    {
      "id": "…",
      "displayName": "Test",
      "role": "owner",
      "status": "active",
      "joinedAt": "…",
      "leftAt": null,
      "userId": "…",
      "isLinked": true
    }
  ],
  "myMemberId": "…",
  "totalSpentCents": 84000,
  "balances": [
    {
      "memberId": "…",
      "displayName": "Test",
      "paidCents": 60000,
      "owedCents": 28000,
      "sentCents": 0,
      "receivedCents": 0,
      "balanceCents": 32000
    }
  ],
  "transfers": [
    { "from": "…", "to": "…", "amountCents": 19000, "fromName": "Alex", "toName": "Test" }
  ]
}

// Une dépense (groupe expense.read)
{
  "id": "…",
  "label": "Restaurant",
  "amount": { "amountCents": 9000, "currency": "EUR" },
  "spentOn": "2026-08-05T02:00:00+02:00",
  "splitStrategy": "equals",
  "paidByMemberId": "…",
  "tagId": null,
  "supersedesId": null,
  "isVoided": false,
  "voidedAt": null,
  "createdAt": "…",
  "shares": [{ "memberId": "…", "amountCents": 3000, "inputValue": null }]
}
```

Les soldes seuls (`GET …/balances`, annulations) renvoient `totalSpentCents`, `balances` et `transfers`.

Un remboursement (groupe `settlement.read`) contient : `id`, `fromMemberId`, `toMemberId`, `amount`, `settledOn`, `note`, `isVoided`, `voidedAt` et `createdAt`.

## Journal

| Événement | Données |
| --- | --- |
| `expense.added` | Groupe, libellé, montant |
| `expense.corrected` | Groupe, dépense remplacée, avant / après |
| `expense.voided` | Groupe, libellé, montant |
| `settlement.recorded` | Groupe, participants, montant |
| `settlement.voided` | Groupe, montant |

La création, le renommage et la clôture du groupe publient les événements `board.*` (voir [budget.md](budget.md#journal-des-modifications)).

## Fixtures

Le groupe « Vacances Biarritz » réunit Test, Camille et Alex, avec des dépenses réparties à parts égales :

| Participant | A payé | Part due | Solde |
| --- | --- | --- | --- |
| Test | 600 € | 280 € | +320 € |
| Camille | 150 € | 280 € | −130 € |
| Alex | 90 € | 280 € | −190 € |

Plan proposé : Alex rembourse 190 € à Test, et Camille 130 € à Test.

## Où trouver le code

| Dossier | Contenu |
| --- | --- |
| `src/Controller/ExpenseSplitter/` | `ExpenseGroupController` (avec `balances`), `ExpenseController`, `SettlementController` |
| `src/Service/ExpenseSplitter/` | `ExpenseGroupService`, `ExpenseService`, `SettlementService`, `BalanceService` |
| `src/Dto/ExpenseSplitter/` | `CreateExpenseGroupDto`, `UpdateExpenseGroupDto`, `AddExpenseDto`, `RecordSettlementDto` |
| `src/Calculator/BalanceCalculator.php`, `src/Calculator/Split/` | Soldes, plan de virements, répartition (partagés avec le module Budget) |
| `src/Entity/Expense.php`, `ExpenseShare.php`, `Settlement.php` | Entités et repositories associés (`sumPaidByMember`, `sumSharesByMember`, `sumSentByMember`, `sumReceivedByMember`, `supersede`) |
| `src/BoardType/ExpenseGroupBoardType.php` | Aucun poste budgétaire, participants acceptés |

## Écarts avec la spécification et points ouverts

- **Ajout** : `GET` et `DELETE /api/expense-groups/{id}/settlements/{settlementId}`, pour lister les remboursements et annuler un remboursement saisi par erreur.
- **Dates `spentOn` et `settledOn`** : elles sortent en date-heure décalée (`"2026-08-05T02:00:00+02:00"`) au lieu de `"2026-08-05"`. Ce sont des colonnes `DATE`, mais le sérialiseur du socle applique le fuseau `Europe/Paris` à des dates créées en UTC. Un front situé dans un autre fuseau pourrait afficher la veille. Correctif proposé : un contexte de sérialisation `Y-m-d` sur ces deux champs.
- **Remontée dans le budget perso** (`expense_rollup`) : prévue pour un lot ultérieur, non développée. `ExpenseGroupBoardType` est prêt à l'accueillir.
- **Codes HTTP** : les refus métier sortent en 400 (socle), pas en 422.
- **Tests** : aucun test automatisé, PHPUnit n'est pas installé.

## Vérifications effectuées

Requêtes HTTP sur les fixtures, toutes conformes :

- liste des groupes ;
- plan de virements (Alex → Test 190 €, Camille → Test 130 €) ;
- remboursement, puis plan mis à jour ;
- annulation du remboursement ;
- dépense en pourcentage (45 / 27 / 18 €) ;
- montants dont la somme est fausse (400) ;
- correction en parts égales (33,34 + 33,33 + 33,33 €) et remplacement de l'ancienne dépense.
