# Module Budget — API

Compte rendu de ce qui a été développé dans `budget_api` pour le module Budget : boards perso et partagés, membres, postes, exceptions du mois, répartitions, invitations et tags. État au 28 octobre 2026.

Modules liés : [Insights](insights.md) (page d'accueil) et [ExpenseSplitter](expense-splitter.md) (dépenses partagées), qui réutilisent le moteur de calcul décrit ici.

## En bref

- Un board s'affiche toujours pour un mois (`?month=AAAA-MM`, mois en cours par défaut). Rien n'est stocké : chaque lecture recalcule le mois demandé.
- Le front n'additionne jamais : `GET /api/boards/{id}` renvoie les lignes, les parts de chaque membre, les totaux, les remontées et l'équilibre.
- Modifier un montant ou une fréquence crée une **révision datée** : les mois passés restent justes.
- La part d'un membre dans un board partagé **remonte** dans son board perso (lien `share_rollup`), ce qui donne son vrai reste à vivre.
- Les règles variables (récurrence, prise en compte, exception, répartition, lien, type de board) sont des **stratégies** désignées par un code en base. En ajouter une ne touche ni au schéma ni au calculateur.

## Conventions communes

Ces règles valent pour les trois modules (Budget, Insights, ExpenseSplitter).

| Sujet | Règle |
| --- | --- |
| Authentification | JWT `Authorization: Bearer <token>` (obtenu par `POST /api/auth/login`). Seul l'aperçu d'invitation `GET /api/invitations/{token}` est public. |
| Montants | Entiers en centimes (`amountCents`). La devise (ISO 4217) est portée par le board. |
| Mois | `AAAA-MM`, toujours le mois entier. Stocké en `DATE` au 1er du mois. |
| Dates | `AAAA-MM-JJ` en entrée. |
| Pourcentages | Points de base : 7 000 = 70 %, total 10 000. |
| Identifiants | UUID v7, au format RFC 4122 dans le JSON. |
| Messages | En français, prêts à afficher. |

Formats d'erreur (hérités de `core-php`) :

| Statut | Corps | Quand |
| --- | --- | --- |
| 400 | `{ "title": "Validation failed !", "violations": { "<champ>": "<message>" }, "status": 400 }` | Champ invalide, règle métier refusée (somme des pourcentages ≠ 100 %, couleur déjà prise…) |
| 400 | `{ "message": "Format de données JSON invalide." }` | Corps JSON illisible |
| 401 | Réponse du firewall JWT | Jeton absent ou expiré |
| 403 | `{ "message": "Vous n'avez pas les droits nécessaires sur ce board." }` | Droit insuffisant (voir [Droits](#droits)) |
| 404 | `{ "title": "Not Found", "message": "Board introuvable." }` | Ressource absente, archivée ou d'un autre type |
| 409, 410, 422, 502 | `{ "message": "…" }` | Conflit, invitation périmée, opération interdite, échec d'envoi d'e-mail |
| 500 | `{ "message": "Erreur interne lors de …" }` | Exception inattendue, journalisée en `critical` par `LoggerTrait` |

Les violations sur un champ imbriqué portent un chemin à points : `recurrenceParams.interval`, `entries`, `splitEntries`.

Les écritures sur un board (poste, exception, répartition, part d'un membre) **renvoient directement le board recalculé**, pour éviter un second appel. Sur les écritures de postes, `?month=AAAA-MM` choisit le mois renvoyé (le mois affiché à l'écran). Sans ce paramètre, l'API renvoie le mois `effectiveFrom`.

## Droits

`App\Security\Voter\BoardVoter` décide des trois attributs.

| Attribut | Propriétaire | Membre actif `editor` | Membre actif `viewer` | Membre invité (non accepté) ou inconnu |
| --- | --- | --- | --- | --- |
| `BOARD_VIEW` : lire le board | oui | oui | oui | non |
| `BOARD_EDIT` : postes, exceptions, répartition, tags du board | oui | oui | non | non |
| `BOARD_MANAGE_MEMBERS` : membres, invitations, suppression | oui | non | non | non |

Un board archivé n'est plus renvoyé par les requêtes (404).

## Modèle de données

Migration : [Version20261027214052.php](../../budget_api/src/Migrations/Version20261027214052.php). C'est la première migration du projet : elle crée aussi les tables `user` et `user_request` du socle.

| Table | Rôle | Écriture |
| --- | --- | --- |
| `board` | Board perso, partagé ou groupe de dépenses (`type`), devise, réglages JSON, propriétaire | Modifiable, archivé (`archived_at`) au lieu d'être supprimé |
| `board_member` | Membre d'un board : compte lié (`user_id`) ou invité local (prénom seul) ; rôle, statut | Modifiable, statut `invited` → `active` → `left` |
| `budget_item` | Le *quoi* d'un poste : type (`income`, `expense`, `savings`), libellé, position, actif ou non | Modifiable, archivé |
| `budget_item_revision` | Le *combien et quand* : montant, récurrence et paramètres JSON, prise en compte, mois de début et de fin, jour de prélèvement, payeur | **Immuable** ; une seule révision par poste et par mois de début |
| `budget_item_adjustment` | Exception d'un mois pour un poste (`include`, `exclude`, `amount`) | **Immuable** ; une par poste et par mois, remplacée en transaction |
| `split_rule` + `split_rule_entry` | Répartition du board ou d'un poste à partir d'un mois, et valeur de chaque membre | **Immuables** ; une nouvelle règle remplace l'ancienne à partir de son mois |
| `board_link` | Remontée `share_rollup` : la part d'un membre d'un board partagé vers son board perso, avec mois de début et de fin | Clôturé au départ du membre |
| `invitation` | Invitation par e-mail ou lien : hash SHA-256 du jeton, statut, expiration, nombre d'utilisations | Modifiable (statut) |
| `tag` + `budget_item_tag` | Tag personnel ou de board (13 couleurs, une couleur par tag) et son association aux postes | Modifiable |
| `domain_event` | Journal des modifications (avant / après, auteur) | **Immuable** |
| `expense`, `expense_share`, `settlement` | Module ExpenseSplitter | Voir [expense-splitter.md](expense-splitter.md) |

`user` reçoit une colonne `settings` (JSON, nullable) : les seuils des insights y sont lus.

Types techniques :

- `App\ValueObject\Period` et le type DBAL `period` : un mois, stocké en `DATE` au 1er du mois, comparable et indexable.
- `App\Entity\Embeddable\Money` : `amount_cents` (`BIGINT`) et `currency` (`CHAR(3)`).
- Les ensembles fermés sont des enums PHP (`src/Enum/Budget/`) : type de poste, rôle, statut de membre ou d'invitation, canal, type de board, couleur, niveau d'insight.
- Les ensembles ouverts restent des codes texte validés par le registre des stratégies : récurrence, prise en compte, exception, répartition, lien.

## Moteur de calcul

`App\Calculator\BoardCalculator::calculate(Board, Period)` produit un `BoardResult`. Pour chaque poste non archivé :

1. **Révision en vigueur** (`RevisionResolver`) : la plus récente dont le mois de début précède ou égale le mois demandé.
2. **Poste désactivé** ou **hors période** (avant le début, après `endPeriod`) : 0.
3. **Récurrence** : le poste tombe-t-il ce mois-ci (`isDue`) ?
4. **Prise en compte** : montant du mois selon le mode.
5. **Exception du mois**, si elle existe.
6. **Répartition** entre les membres : la règle du poste, sinon celle du board, sinon parts égales.

Les membres partis (`left`) ne reçoivent plus de part.

### Stratégies disponibles

| Famille | Code | Paramètres | Effet |
| --- | --- | --- | --- |
| Récurrence | `interval` | `{"interval": 1–120, "anchor": "AAAA-MM"}` | Tous les N mois à partir de l'ancre. Sans ancre, l'API prend le mois de début et la conserve lors des révisions suivantes. |
| Récurrence | `specific_months` | `{"months": [1–12, …]}` | Les mois indiqués de chaque année (taxe foncière en octobre). |
| Récurrence | `one_off` | `{}` | Le seul mois de début ; `endPeriod` est fixé sur ce mois. |
| Prise en compte | `on_due` | — | Montant entier le mois où il tombe, 0 les autres mois. |
| Prise en compte | `smoothed` | — | Montant × occurrences ÷ mois du cycle, chaque mois. 85 € tous les 2 mois donne 42,50 €/mois. |
| Exception | `include` | — | Compte le montant normal, même hors échéance (facture décalée). |
| Exception | `exclude` | — | 0 ce mois-ci. |
| Exception | `amount` | `amountCents` obligatoire | Montant réel du mois (facture de mars à 97,40 €). |
| Répartition | `equals` | Valeurs ignorées ; liste vide = tous les membres | Parts égales. |
| Répartition | `percentage` | Points de base, total 10 000 | Au prorata des pourcentages. |
| Répartition | `amount` | Centimes | Montant fixe par membre. Si le montant du mois diffère (lissé, exception), les montants servent de poids. |
| Lien | `share_rollup` | — | La part d'un membre remonte dans son board perso. |
| Type de board | `personal` | — | Tout type de poste, pas d'autre membre ; cible des remontées. |
| Type de board | `shared` | — | Dépenses et épargne, **pas de revenus** ; crée le lien `share_rollup` quand un compte rejoint le board. |
| Type de board | `expense_group` | — | Aucun poste budgétaire : voir ExpenseSplitter. |

`recurrenceParams.variable: true` marque une facture variable (électricité). Les insights s'en servent pour suggérer la saisie du montant réel.

Ajouter une stratégie : une classe qui implémente l'interface de sa famille (`RecurrenceHandlerInterface`, `AllocationHandlerInterface`, `AdjustmentHandlerInterface`, `SplitStrategyInterface`, `BoardLinkHandlerInterface`, `BoardTypeHandlerInterface`) avec l'attribut `#[AsTaggedItem('<code>')]`. `StrategyRegistry` la trouve seul. Un code inconnu en base lève `UnknownStrategyException` au lieu de compter 0 en silence.

### Totaux

| Clé de `totals` | Calcul |
| --- | --- |
| `incomeCents` | Revenus du mois |
| `expenseCents` | Dépenses propres au board |
| `ownSavingsCents` | Épargne propre au board |
| `rollupExpenseCents` | Quotes-parts de dépenses remontées des boards partagés |
| `rollupSavingsCents` | Quotes-parts d'épargne remontées |
| `chargesCents` | `expenseCents + rollupExpenseCents` |
| `savingsCents` | `ownSavingsCents + rollupSavingsCents` |
| `remainingCents` | Reste à vivre : `incomeCents − chargesCents − savingsCents` |
| `chargesRatio` | `chargesCents ÷ incomeCents × 100`, arrondi à 0,1 ; `null` sans revenus |
| `householdCents` | `expenseCents + ownSavingsCents` : coût total d'un board partagé |

### Arrondis

`RemainderDistributor` répartit un total entier au prorata de poids entiers, sans `float`. La somme des parts vaut toujours le total. Les centimes restants vont un par un au plus gros poids, puis au premier membre dans l'ordre de création : 100 € entre trois donnent 33,34 + 33,33 + 33,33.

### Équilibre d'un board partagé

Dès deux membres, `balance` contient :

- `contributions` : la part de chacun dans les postes payés par le compte commun (`paidByMemberId` à `null`). C'est le versement à faire en début de mois.
- `balances` : ce que le compte d'un membre a payé directement, moins sa part de ces mêmes postes. Positif : on lui doit de l'argent.
- `transfers` : plan de virements glouton (`BalanceCalculator`), au plus n − 1 virements.
- `summary` : à deux membres seulement, « Test doit rembourser 2,50 € à Camille » ou « Les comptes sont équilibrés ce mois-ci. ». `null` au-delà.

### Remontée dans le board perso

Sur un board perso, `rollups` contient un `RollupResult` par lien actif ce mois-ci :

- `expenseCents` et `savingsCents` : ma part du mois ;
- `contributionCents` et `balanceCents` : mon versement au compte commun et mon solde ;
- `lines` : ma part poste par poste (`amountCents`) et le montant du foyer (`householdAmountCents`), pour l'affichage détaillé.

Le lien commence au mois où le compte rejoint le board et se clôt au mois de son départ. Les revenus ne remontent pas.

Les résultats sont mémorisés le temps d'une requête : un board partagé n'est calculé qu'une fois, même s'il remonte chez plusieurs membres. Après une écriture, les services appellent `recalculate()`.

## Endpoints

37 routes au total pour les trois modules (`php bin/console debug:router`). Celles du module Budget :

### Boards

| Méthode et route | Droit | Corps | Réponse |
| --- | --- | --- | --- |
| `GET /api/boards?month=` | Connecté | — | 200 `{ period, boards: [résumé] }` : board perso d'abord, puis boards partagés. Crée le board perso s'il manque. |
| `POST /api/boards` | Connecté | `CreateBoardDto` | 201 board calculé du mois en cours. 409 si un board perso existe déjà. |
| `GET /api/boards/{id}?month=` | `BOARD_VIEW` | — | 200 board calculé |
| `PUT /api/boards/{id}` | `BOARD_EDIT` | `UpdateBoardDto` | 200 board (groupe `board.read`) |
| `DELETE /api/boards/{id}` | `BOARD_MANAGE_MEMBERS` | — | 204, archivage. 422 sur le board perso. |
| `PUT /api/boards/{id}/split-rule` | `BOARD_EDIT` | `SplitRuleDto` | 200 board calculé au mois `effectiveFrom` |

Résumé d'un board dans la liste : `id`, `type`, `name`, `currency`, `role`, `memberCount`, `totals`, `myShareCents`, et `balance` (`contributionCents`, `balanceCents`, `summary`, ou `null` sur un board perso).

```jsonc
// POST /api/boards — CreateBoardDto
{
  "type": "shared",              // "personal" | "shared"
  "name": "Appartement",         // obligatoire, 120 caractères max
  "currency": "EUR",             // ISO 4217 en majuscules
  "settings": { "rollupDisplay": "grouped" },
  "guests": ["Camille"]          // invités locaux créés avec le board
}

// PUT /api/boards/{id} — UpdateBoardDto (settings fusionnés avec l'existant)
{ "name": "Appartement Lyon", "settings": { "rollupDisplay": "detailed" } }

// PUT /api/boards/{id}/split-rule — SplitRuleDto
{
  "strategy": "percentage",      // "equals" | "percentage" | "amount"
  "effectiveFrom": "2026-11",    // mois en cours par défaut
  "entries": [
    { "memberId": "…", "value": 7000 },
    { "memberId": "…", "value": 3000 }
  ]
}
```

### Membres

| Méthode et route | Droit | Corps | Réponse |
| --- | --- | --- | --- |
| `POST /api/boards/{id}/members` | `BOARD_MANAGE_MEMBERS` | `AddMemberDto` | 201 `{ member, invitationSent }` |
| `PUT /api/boards/{id}/members/{memberId}` | `BOARD_MANAGE_MEMBERS` | `UpdateMemberDto` | 200 board calculé |
| `DELETE /api/boards/{id}/members/{memberId}` | `BOARD_MANAGE_MEMBERS` | — | 204 ; le membre passe à `left` |

```jsonc
// POST /api/boards/{id}/members — AddMemberDto
{
  "displayName": "Camille",      // obligatoire
  "email": "camille@example.com", // facultatif : envoie une invitation, le membre reste « invited »
  "role": "editor"               // "editor" | "viewer"
}

// PUT /api/boards/{id}/members/{memberId} — UpdateMemberDto (tous les champs facultatifs)
{
  "displayName": "Cam",
  "role": "viewer",
  "shareBasisPoints": 4000,      // nouvelle part : 40 %
  "effectiveFrom": "2027-01"
}
```

Sans e-mail, le membre est un **invité local** actif : sa part est calculée, mais rien ne remonte nulle part.

`shareBasisPoints` crée une règle `percentage` du board. Les autres membres se partagent le reste au prorata de leur part actuelle (à parts égales si la règle en vigueur n'est pas en pourcentage).

Refus :

- 422 sur un board perso, ou pour retirer le propriétaire ;
- 409 si l'e-mail appartient déjà à un membre lié ;
- 400 pour changer le rôle du propriétaire ;
- 422 ou 502 si l'invitation n'a pas pu partir (le membre est créé quand même).

Au départ d'un membre, ses invitations en attente sont révoquées et sa remontée s'arrête.

### Postes

| Méthode et route | Droit | Corps | Réponse |
| --- | --- | --- | --- |
| `POST /api/boards/{id}/items?month=` | `BOARD_EDIT` | `CreateItemDto` | 201 board calculé |
| `PUT /api/boards/{id}/items/{itemId}?month=` | `BOARD_EDIT` | `ReviseItemDto` | 200 board calculé |
| `PATCH /api/boards/{id}/items/{itemId}/toggle?month=` | `BOARD_EDIT` | — | 200 board calculé |
| `DELETE /api/boards/{id}/items/{itemId}` | `BOARD_EDIT` | — | 204, archivage (l'historique reste) |

```jsonc
// POST /api/boards/{id}/items — CreateItemDto
{
  "kind": "expense",                // "income" | "expense" | "savings"
  "label": "Électricité",
  "amountCents": 8500,
  "recurrenceType": "interval",
  "recurrenceParams": { "interval": 2, "anchor": "2026-01", "variable": true },
  "allocation": "on_due",           // "on_due" | "smoothed"
  "effectiveFrom": "2026-01",       // mois en cours par défaut
  "endPeriod": null,
  "dueDay": 12,                     // 1 à 31
  "paidByMemberId": null,           // null = compte commun
  "position": null,                 // à la suite par défaut
  "tagIds": ["…"],
  "splitStrategy": null,            // répartition propre au poste, sinon celle du board
  "splitEntries": []
}
```

`ReviseItemDto` reprend les mêmes champs, sauf `kind`, et `effectiveFrom` y devient obligatoire.

- Le libellé, la position et les tags changent sur le poste lui-même.
- Le montant, la récurrence, le mode, la fin, le jour et le payeur créent une révision à partir de `effectiveFrom`.
- Une révision du même mois remplace la précédente.
- `tagIds: null` laisse les tags intacts ; `[]` les retire tous.
- `splitStrategy: null` laisse la répartition intacte.

`toggle` sert à la simulation : un poste désactivé compte pour 0 sur tous les mois, sans perdre sa règle.

Refus en 400 :

- revenu sur un board partagé ;
- récurrence ou mode inconnu, paramètres invalides ;
- mois de fin avant le début ;
- payeur hors du board ;
- tag inutilisable sur ce board.

### Exceptions du mois

| Méthode et route | Droit | Corps | Réponse |
| --- | --- | --- | --- |
| `PUT /api/boards/{id}/items/{itemId}/months/{AAAA-MM}` | `BOARD_EDIT` | `SetAdjustmentDto` | 200 board calculé du mois |
| `DELETE /api/boards/{id}/items/{itemId}/months/{AAAA-MM}` | `BOARD_EDIT` | — | 200 board calculé ; 404 si le mois n'a pas d'exception |

```jsonc
// SetAdjustmentDto — menu « Ce mois-ci » d'une ligne
{ "type": "amount", "amountCents": 9740, "note": "Facture réelle" }
// "include" (compter) et "exclude" (ne pas compter) n'ont pas besoin de montant
```

Le `DELETE` correspond à « Revenir à la règle ». Une exception est refusée (400) si aucune règle n'est en vigueur ce mois-là.

### Invitations

| Méthode et route | Droit | Corps | Réponse |
| --- | --- | --- | --- |
| `POST /api/boards/{id}/invitations` | `BOARD_MANAGE_MEMBERS` | `InviteMemberDto` | 201 `{ invitation, member, url }` |
| `DELETE /api/boards/{id}/invitations/{invitationId}` | `BOARD_MANAGE_MEMBERS` | — | 204 ; 409 si l'invitation n'est plus en attente |
| `GET /api/invitations/{token}` | **Public** | — | 200 aperçu |
| `POST /api/invitations/{token}/accept` | Connecté | — | 200 `{ message, boardId, boardType, memberId }` |

```jsonc
// InviteMemberDto
{
  "channel": "link",       // "email" (e-mail obligatoire) | "link"
  "email": null,
  "memberId": "…",         // invité local existant à rattacher, sinon nouveau membre « invited »
  "displayName": null,     // pour un nouveau membre ; déduit de l'e-mail à défaut
  "maxUses": 1,            // 1 à 50, lien uniquement (1 pour un e-mail)
  "ttlDays": 7             // 1 à 30
}
```

- Le jeton fait 64 caractères hexadécimaux et seul son hash SHA-256 est stocké. Le lien `{FRONTEND_URL}/invitations/{token}` n'est donc renvoyé qu'une fois, dans `url`, pour le canal `link`.
- Émettre une invitation révoque les précédentes du même membre. Si l'e-mail ne part pas, l'invitation est révoquée.
- Aperçu public : `boardName`, `boardType`, `boardTypeLabel`, `invitedBy`, `memberName`, `expiresAt`, `status`, `isUsable`.
- À l'acceptation, le compte est rattaché au membre, qui passe à `active`. Sur un board partagé, sa part remonte dans son board perso dès le mois en cours.
- Un lien à usages multiples crée un membre par nouvel arrivant.
- Refus : 410 si l'invitation a expiré, a été révoquée ou déjà utilisée ; 409 si la personne fait déjà partie du board.

### Tags

| Méthode et route | Droit | Corps | Réponse |
| --- | --- | --- | --- |
| `GET /api/tags?boardId=` | Connecté (`BOARD_VIEW` avec `boardId`) | — | 200 `{ tags }` : mes tags, ou ceux du board |
| `POST /api/tags` | Connecté (`BOARD_EDIT` avec `boardId`) | `TagDto` | 201 tag |
| `PUT /api/tags/{tagId}` | Propriétaire du tag, ou `BOARD_EDIT` pour un tag de board | `TagDto` | 200 tag |
| `DELETE /api/tags/{tagId}` | Idem | — | 204 ; les postes et dépenses perdent simplement ce tag |

```jsonc
// TagDto
{ "name": "Logement", "color": "blue", "boardId": null } // boardId renseigné = tag du board partagé
```

- Couleurs : `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `teal`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `gray`.
- Une couleur ne sert qu'à un tag, donc 13 tags au plus par propriétaire (refus en 400 au-delà, ou si la couleur est prise).
- Tag renvoyé : `id`, `name`, `color`, `hex`, `boardId`, `scope` (`user` ou `board`).

## Board calculé

Réponse de `GET /api/boards/{id}` et des écritures sur un board. Extrait réel du board partagé des fixtures, en octobre 2026 (listes réduites à un élément) :

```json
{
  "board": {
    "id": "01a17f6c-…",
    "type": "shared",
    "name": "Appartement",
    "currency": "EUR",
    "settings": { "rollupDisplay": "grouped" },
    "myMemberId": "01a17f6c-…",
    "permissions": { "canEdit": true, "canManageMembers": true }
  },
  "boardId": "01a17f6c-…",
  "type": "shared",
  "name": "Appartement",
  "currency": "EUR",
  "period": "2026-10",
  "members": [
    { "id": "…", "displayName": "Test", "status": "active", "role": "owner", "userId": "…" }
  ],
  "lines": [
    {
      "itemId": "…",
      "kind": "expense",
      "label": "Loyer",
      "position": 0,
      "isActive": true,
      "isDue": true,
      "isMonthly": true,
      "isVariable": false,
      "amountCents": 117000,
      "ruleAmountCents": 117000,
      "recurrenceType": "interval",
      "allocation": "on_due",
      "dueDay": 5,
      "paidByMemberId": null,
      "adjustmentType": null,
      "tags": [{ "id": "…", "name": "Logement", "color": "blue", "hex": "#3b82f6" }],
      "shares": { "<memberId Test>": 58500, "<memberId Camille>": 58500 }
    }
  ],
  "rollups": [],
  "totals": {
    "incomeCents": 0,
    "expenseCents": 171000,
    "ownSavingsCents": 0,
    "rollupExpenseCents": 0,
    "rollupSavingsCents": 0,
    "chargesCents": 171000,
    "savingsCents": 0,
    "remainingCents": -171000,
    "chargesRatio": null,
    "householdCents": 171000
  },
  "memberShares": { "<memberId Test>": 85500, "<memberId Camille>": 85500 },
  "balance": {
    "contributions": { "<memberId Test>": 81750, "<memberId Camille>": 81750 },
    "balances": { "<memberId Test>": -250, "<memberId Camille>": 250 },
    "transfers": [
      { "from": "<memberId Test>", "to": "<memberId Camille>", "amountCents": 250, "fromName": "Test", "toName": "Camille" }
    ],
    "summary": "Test doit rembourser 2,50 € à Camille"
  }
}
```

Champs d'une ligne :

- `amountCents` : montant compté ce mois-ci ;
- `ruleAmountCents` : montant de la règle en vigueur ;
- `isDue` : le poste tombe ce mois-ci ;
- `isMonthly` : récurrence mensuelle ;
- `adjustmentType` : l'exception appliquée, ou `null` ;
- `shares` : la part de chaque membre.

Sur un board partagé, `remainingCents` est négatif par construction (aucun revenu) : l'écran doit afficher `householdCents`.

## Journal des modifications

Chaque écriture publie un `DomainEventOccurred`. `DomainEventRecorder` l'enregistre dans `domain_event` : type et identifiant de l'agrégat, type d'événement, données avant et après, auteur.

| Agrégat | Événements |
| --- | --- |
| `board` | `board.created`, `board.updated`, `board.archived`, `board.split_rule_changed`, `board.member_added`, `board.member_invited`, `board.member_joined`, `board.member_updated`, `board.member_left`, `board.invitation_revoked` |
| `budget_item` | `budget_item.created`, `budget_item.revised`, `budget_item.toggled`, `budget_item.archived`, `budget_item.adjusted`, `budget_item.adjustment_removed` |
| `expense`, `settlement` | Voir [expense-splitter.md](expense-splitter.md) |

Aucun endpoint n'expose encore ce journal.

## E-mail d'invitation

Chaîne du socle : [BoardInvitationMailDto.php](../../budget_api/src/Dto/Mail/BoardInvitationMailDto.php) → entrée dans `EmailDispatcherService::HANDLER_MAP` → [BoardInvitationMailHandler.php](../../budget_api/src/Mailer/BoardInvitationMailHandler.php) → [board_invitation.html.twig](../../budget_api/templates/emails/budget/board_invitation.html.twig).

L'e-mail reprend le prénom de l'invité, l'auteur de l'invitation, le nom et le type du board, le bouton d'acceptation et la date d'expiration. Il apparaît dans la prévisualisation admin (`GET /api/admin/emails/board-invitation`) grâce à `EmailMockService`.

## Branchements dans le socle

| Fichier | Modification |
| --- | --- |
| `src/Service/AuthService.php` | Envoie `UserActivatedEvent` à la vérification de l'e-mail (et à la réinitialisation du mot de passe d'un compte pas encore vérifié). `CreatePersonalBoardListener` crée alors « Mon budget ». |
| `src/Service/AccountService.php` | Appelle `AccountBoardsCleaner` avant la suppression du compte. Un board partagé passe au premier autre membre lié, les adhésions deviennent des invités locaux, et le board perso et les tags partent en cascade. |
| `src/Service/EmailDispatcherService.php`, `src/Service/EmailMockService.php` | E-mail d'invitation et son jeu de données de prévisualisation. |
| `src/Entity/User.php` | Colonne `settings` (JSON). |
| `src/DataFixtures/AppFixtures.php` | Constantes `TEST_USER`, `ADMIN_USER` et références pour `BudgetFixtures`. |
| `config/packages/doctrine.yaml` | Type DBAL `period`. |
| `config/packages/security.yaml` | `GET /api/invitations/{token}` en accès public. |

Le board perso est aussi créé à la volée par `GET /api/boards` et `GET /api/insights` pour les comptes activés avant le module.

## Fixtures

`php bin/console doctrine:fixtures:load` charge [BudgetFixtures.php](../../budget_api/src/DataFixtures/BudgetFixtures.php) après les comptes du socle (`test@example.com` et `admin@example.com`, mot de passe `Password123!`). C'est l'exemple chiffré de la spécification.

« Mon budget » de Test :

| Poste | Règle |
| --- | --- |
| Salaire | 2 800 €/mois |
| Pass Navigo | 90,80 € |
| Forfait mobile | 12 € |
| Assurance auto | 45 € |
| Salle de sport | Désactivée (simulation), de septembre à juin |
| Cadeaux de Noël | Ponctuel, décembre 2026 |
| Livret A | 400 € d'épargne |

Board partagé « Appartement » avec Camille, invitée par e-mail (jeton fixe `invitation-camille-appartement`) :

| Poste | Règle |
| --- | --- |
| Loyer | 1 150 € puis 1 170 € à partir de juillet 2026 |
| Courses | 450 €, réparties 60/40 à partir de 2027 |
| Internet | 35 €, payé par Test |
| Assurance habitation | 180 €/an, lissée |
| Streaming | 40 €, payé par Camille |
| Électricité | 85 € tous les 2 mois, variable, facture réelle de 97,40 € en mars |

En octobre 2026, l'API renvoie :

- foyer : 1 710 € ;
- part de Test : 855 € ;
- charges de Test : 1 002,80 € ;
- reste à vivre : 1 397,20 € ;
- taux de charges : 35,8 % ;
- équilibre : « Test doit rembourser 2,50 € à Camille ».

Le groupe de dépenses « Vacances Biarritz » est décrit dans [expense-splitter.md](expense-splitter.md).

## Où trouver le code

| Dossier | Contenu |
| --- | --- |
| `src/Controller/Budget/` | `BoardController`, `MemberController`, `ItemController`, `AdjustmentController`, `InvitationController`, `TagController` |
| `src/Service/Budget/` | Un service par contrôleur, plus `BoardFactory`, `SplitRuleWriter`, `InvitationIssuer`, `AccountBoardsCleaner` et le trait `BudgetServiceTrait` |
| `src/Calculator/` | `BoardCalculator`, `BalanceCalculator`, `RevisionResolver`, `StrategyRegistry`, les stratégies par famille et les objets de résultat |
| `src/BoardType/` | Comportement des types de board (`personal`, `shared`, `expense_group`) |
| `src/Dto/Budget/` | DTO d'entrée validés |
| `src/Entity/`, `src/Repository/` | Entités et repositories ; chaque repository expose `save()` et `remove()` comme `UserRepository` |
| `src/Enum/Budget/`, `src/ValueObject/`, `src/Doctrine/Type/` | Enums, `Period`, type DBAL |
| `src/Event/`, `src/EventListener/` | `UserActivatedEvent`, `DomainEventOccurred`, création du board perso, journal |
| `src/Security/Voter/BoardVoter.php` | Droits sur un board |

## Écarts avec la spécification et points ouverts

Choix assumés :

- **Organisation à plat** (`App\Entity`, `App\Service\Budget`…) plutôt qu'un module `Budget` isolé : le socle fait foi.
- `RecurrenceHandlerInterface::cycle()` remplace `intervalMonths()` : le lissage de `specific_months` a besoin du nombre d'occurrences en plus de la durée du cycle.
- **Un seul événement générique**, `DomainEventOccurred`, plutôt qu'une classe par événement.
- Les transitions de statut des membres sont gardées dans `BoardMember` : `symfony/workflow` n'est pas installé.
- La devise est validée par une regex à trois majuscules : `Assert\Currency` exige `symfony/intl`, absent du projet.
- Routes ajoutées par rapport à la table de la spécification :
  - `PUT /api/boards/{id}/split-rule` ;
  - CRUD `/api/tags` ;
  - aperçu public d'une invitation ;
  - `?month=` sur les écritures de postes.

Points à traiter :

- **Codes HTTP des refus métier** : `sendViolations()` (socle) renvoie 400 là où la spécification annonce 422 (somme des pourcentages fausse, par exemple). Le comportement du socle est conservé.
- **`myShareCents` sur le board perso** additionne revenus, charges et épargne (3 347,80 € dans les fixtures) : la valeur n'a pas de sens sur ce type de board. Elle est à ignorer côté front, ou à passer à `null` côté API.
- **Contrainte CHECK** « un seul propriétaire » d'un tag : imposée par le constructeur de `Tag`, pas par la base.
- **Remontée** : elle commence au mois où le compte rejoint le board, pas avant.
- **Journal** : enregistré, mais aucun endpoint de lecture.
- **Tests** : PHPUnit n'est pas installé, le dépôt ne contient aucun test. La spécification demande en priorité les tests unitaires du calculateur.
- **ADR** : la fiche de décision demandée pour chaque migration n'est pas écrite.

## Vérifications effectuées

- `php bin/console lint:container`, `doctrine:schema:validate` (mapping et synchronisation), `lint:twig templates/` et un `cache:warmup` en `prod` passent.
- Moteur de calcul : 29 contrôles sur l'exemple chiffré, les révisions, l'électricité, le lissage, les arrondis et les virements. Tous passent.
- HTTP : environ 50 requêtes à travers le kernel complet (routage, firewall, `access_control`, voters, sérialiseur), toutes conformes. Elles couvrent :
  - 401, 403 et 404 ;
  - le board calculé et la liste ;
  - les exceptions, les révisions et la simulation ;
  - la répartition 70/30 ;
  - l'invitation publique, son acceptation puis le 410 ;
  - les membres ;
  - les tags ;
  - la prévisualisation de l'e-mail.

  Dans l'environnement de développement, la clé privée JWT ne s'ouvre pas avec la passphrase configurée : les requêtes ont donc été jouées avec un utilisateur posé directement dans le `TokenStorage`.
