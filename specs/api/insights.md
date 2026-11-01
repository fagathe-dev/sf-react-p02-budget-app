# Module Insights — API

Compte rendu de ce qui a été développé dans `budget_api` pour la page d'accueil (Insights). État au 28 octobre 2026.

La page répond d'abord à « combien me reste-t-il ce mois-ci ? », puis à « qu'est-ce qui mérite mon attention ? ». Elle suit le mois choisi dans le sélecteur, comme les boards.

Conventions (authentification, centimes, format des erreurs) : voir [budget.md](budget.md#conventions-communes).

## En bref

- Un seul appel, `GET /api/insights?month=AAAA-MM`, renvoie les KPI du mois, les messages à surveiller, les postes à venir et le résumé des boards partagés.
- Rien n'est stocké. Le service réutilise `BoardCalculator` sur quatre mois du board perso (le mois affiché, le précédent et les deux suivants) et sur le mois affiché de chaque board partagé.
- Chaque message vient d'une **règle** indépendante. En ajouter une ne modifie pas `InsightService`.

## Endpoint

| Méthode et route | Droit | Réponse |
| --- | --- | --- |
| `GET /api/insights?month=AAAA-MM` | Connecté | 200 `{ period, kpis, insights, upcoming, sharedBoards }` ; 400 si le mois est invalide |

Le mois en cours sert par défaut. Comme pour `GET /api/boards`, le board perso est créé s'il manque.

```json
{
  "period": "2026-10",
  "kpis": {
    "incomeCents": 280000,
    "chargesCents": 100280,
    "sharedChargesCents": 85500,
    "savingsCents": 40000,
    "remainingCents": 139720,
    "chargesRatio": 35.8,
    "remainingDeltaCents": 4250,
    "chargesDeltaCents": -4250
  },
  "insights": [
    {
      "key": "common_account_transfer:01a17f6c-…",
      "level": "reminder",
      "message": "Versement de 817,50 € à faire sur le compte commun « Appartement ».",
      "link": "/boards/01a17f6c-…?month=2026-10",
      "amountCents": 81750
    }
  ],
  "upcoming": [
    {
      "itemId": "…",
      "boardId": "…",
      "boardName": "Mon budget",
      "label": "Livret A",
      "kind": "savings",
      "dueDay": 1,
      "amountCents": 40000,
      "tags": [{ "id": "…", "name": "Épargne", "color": "yellow", "hex": "#eab308" }]
    }
  ],
  "sharedBoards": [
    {
      "boardId": "…",
      "name": "Appartement",
      "householdCents": 171000,
      "myShareCents": 85500,
      "contributionCents": 81750,
      "balanceCents": -250,
      "summary": "Test doit rembourser 2,50 € à Camille"
    }
  ]
}
```

Extrait réel des fixtures en octobre 2026, listes réduites à un élément.

### KPI

Tous les KPI portent sur le board perso, remontées comprises (voir [Totaux](budget.md#totaux)).

| Clé | Contenu |
| --- | --- |
| `incomeCents` | Revenus |
| `chargesCents` | Charges perso + quotes-parts remontées |
| `sharedChargesCents` | Quotes-parts remontées des boards partagés (`rollupExpenseCents`) |
| `savingsCents` | Épargne, remontées comprises |
| `remainingCents` | Reste à vivre |
| `chargesRatio` | Taux de charges en %, `null` sans revenus |
| `remainingDeltaCents` | Écart du reste à vivre avec le mois précédent |
| `chargesDeltaCents` | Écart des charges avec le mois précédent |

### Postes à venir

`upcoming` liste les postes perso (hors revenus) et les quotes-parts remontées qui tombent ce mois-ci avec un montant positif. Ils sont triés par jour de prélèvement, puis par libellé ; les jours inconnus passent en fin de liste. Le montant est toujours la part de l'utilisateur.

### Boards partagés

`sharedBoards` résume chaque board partagé non archivé dont l'utilisateur est propriétaire ou membre :

- `householdCents` : coût total du foyer ;
- `myShareCents` : ma part ;
- `contributionCents` : mon versement au compte commun ;
- `balanceCents` : mon solde ;
- `summary` : phrase d'équilibre (à deux membres).

## Règles

Les messages sont triés du plus urgent au moins urgent (`alert`, `warning`, `reminder`, `suggestion`, `info`), puis par montant décroissant. `key` est stable : le front peut s'en servir pour masquer un message déjà lu. `link` pointe vers l'écran du board concerné.

| Classe | `key` | Niveau | Se déclenche quand | Message |
| --- | --- | --- | --- | --- |
| `NegativeRemainingRule` | `negative_remaining` | `alert` | Le reste à vivre du mois est négatif | « Votre reste à vivre est négatif ce mois-ci : −120,00 €. » |
| `ChargesRatioRule` | `charges_ratio` | `warning` | Le taux de charges dépasse le seuil (50 % par défaut) | « Vos charges représentent 62,4 % de vos revenus, au-dessus de votre seuil de 50 %. » |
| `UpcomingLargeDueRule` | `upcoming_large_due:<itemId>:<mois>` | `warning` | Une dépense non mensuelle, comptée à l'échéance, tombe dans les deux mois suivants et atteint le seuil (300 € par défaut). Postes perso et parts remontées. | « « Taxe foncière » tombe en novembre 2026 : 600,00 €. Pensez à provisionner. » |
| `CommonAccountTransferRule` | `common_account_transfer:<boardId>` | `reminder` | Pour chaque board partagé où l'utilisateur doit verser quelque chose au compte commun | « Versement de 817,50 € à faire sur le compte commun « Appartement ». » |
| `MissingAdjustmentRule` | `missing_adjustment:<itemId>:<mois>` | `suggestion` | Une facture variable (`recurrenceParams.variable`) est échue sans montant réel saisi. Pour le mois en cours, seulement une fois son jour de prélèvement passé. Board perso et boards partagés. | « Saisissez le montant réel de « Électricité » pour ce mois-ci. » |
| `NonMonthlyDueRule` | `non_monthly_due:<itemId>` | `info` | Une dépense non mensuelle tombe ce mois-ci (perso ou part remontée) | « « Électricité » tombe ce mois-ci : 42,50 €. » |

Les montants des exemples sont fictifs, sauf celui du versement au compte commun, tiré des fixtures.

### Seuils

Les deux seuils se lisent dans `user.settings` (JSON). Sans valeur, les défauts de `InsightContext` s'appliquent.

| Clé | Défaut | Utilisée par |
| --- | --- | --- |
| `chargesRatioThreshold` | `50` (%) | `ChargesRatioRule` |
| `largeDueThresholdCents` | `30000` (300 €) | `UpcomingLargeDueRule` |

Aucun endpoint ne permet encore de modifier ces réglages : le profil du socle (`PUT /api/account/profile`) ne touche pas à `settings`.

## Ajouter une règle

1. Créer une classe dans `src/Insight/Rule/` qui implémente `InsightRuleInterface` :
   - `supports(InsightContext)` dit si la règle s'applique ;
   - `evaluate(InsightContext)` renvoie une liste d'`Insight`.
2. C'est tout. L'interface porte `#[AutoconfigureTag]` et `InsightService` reçoit les règles par `#[AutowireIterator]`.

`InsightContext` fournit déjà les calculs : le board perso du mois, du mois précédent et des deux suivants, les boards partagés du mois, la date du jour et les seuils de l'utilisateur. Une règle ne recalcule jamais rien elle-même.

## Où trouver le code

| Fichier | Rôle |
| --- | --- |
| `src/Controller/Budget/InsightController.php` | Route `api_insight_index` |
| `src/Insight/InsightService.php` | Assemble KPI, règles, postes à venir et boards partagés |
| `src/Insight/InsightContext.php` | Données lues par les règles, seuils par défaut |
| `src/Insight/Insight.php` | Un message `{ key, level, message, link, amountCents }` |
| `src/Insight/Rule/` | Les six règles |
| `src/Enum/Budget/InsightLevelEnum.php` | Niveaux et ordre d'affichage |

## Vérifications effectuées

Contrôlé par requête HTTP sur les fixtures, avec un poste ajouté pendant le test (taxe foncière de 1 200 € en octobre) : 200, part commune de 1 455 €, liste d'insights non vide.

Points ouverts :

- Aucun test automatisé : PHPUnit n'est pas installé.
- Les seuils ne sont pas modifiables par l'API.
