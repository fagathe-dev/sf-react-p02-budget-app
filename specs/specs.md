# Application Budget — Boards perso & partagé

Oct 27, 2026 · @Frédérick

Une application de budget mensuel prévisionnel : un board partagé calcule la part de chacun dans les charges du foyer, et cette part remonte automatiquement dans le board perso pour donner le vrai reste à vivre. Un module ExpenseSplitter partage en plus les dépenses réelles d'un groupe (vacances, sorties) et calcule qui doit combien à qui.

## Le principe

On saisit chaque charge commune une seule fois, dans le board partagé. La part de chaque membre est ensuite déduite automatiquement de son board perso.

&#91;embedded content: deux boards liés · remontée automatique de la quote-part\]

Le board perso affiche la part commune sur une ligne, ou détaillée poste par poste (Loyer, ma part : 585,00 €). Le reste à vivre tient donc toujours compte du foyer.

## Concepts

L'application ne suit pas les dépenses réelles au jour le jour : elle modélise un **budget type mensuel**. Six notions suffisent.

| Notion | Définition | Exemple |
| --- | --- | --- |
| Board perso | Le budget d'une personne : revenus, charges perso, épargne et quotes-parts remontées | « Mon Budget » |
| Board partagé | Les charges communes d'un foyer, réparties entre ses membres | « Appartement » |
| Membre | Une personne d'un board partagé : un compte de l'appli, ou un simple prénom (invité local) | Toi + ta partenaire |
| Poste (BudgetItem) | Une ligne : revenu, dépense ou épargne, avec montant, fréquence et tag | Loyer, 1 170 €, mensuel |
| Répartition | La part de chaque membre : celle du board par défaut, surchargeable par ligne | 50/50, ou 70/30 sur une ligne |
| Payeur | Le compte qui prélève la dépense : compte commun ou celui d'un membre | Loyer prélevé sur le compte commun |

Deux fonctions transverses s'ajoutent : les **tags colorés façon Finder** pour classer les postes, et l'**activation / désactivation d'une ligne** pour simuler l'impact d'une dépense sans la supprimer.

## Règles de calcul

Tous les montants sont des entiers en centimes, et tous les totaux sont recalculés côté serveur par `BoardCalculatorService` : le front n'additionne jamais lui-même.

1. **Équivalent mensuel d'un poste :** dépend du mois affiché, de la récurrence du poste et de son mode (à l'échéance ou lissé) : voir Prise en compte par mois. Arrondi au centime.
2. **Part d'un membre sur un poste :** équivalent mensuel × pourcentage du membre (celui de la ligne s'il est surchargé, sinon celui du board).
3. **Arrondis :** la somme des parts doit toujours égaler le total. Le centime restant (ex. 10,01 € en 50/50) est attribué de façon déterministe, par exemple au membre qui a la plus grande part, puis au premier par ordre de création.
4. **Board perso :**
   - Total charges = dépenses perso + quotes-parts des boards partagés.
   - Reste à vivre = revenus − total charges − épargne.
   - Taux de charges = total charges ÷ revenus.
5. **Équilibre d'un board partagé :**
   - Versement au compte commun de chaque membre = sa part des postes prélevés sur le compte commun.
   - Solde de chaque membre = ce que son compte a prélevé − sa part de ces mêmes postes. Un solde positif signifie qu'on lui doit de l'argent.
   - À deux membres, une seule phrase suffit : « B doit rembourser X € à A ». À trois ou plus, on calcule le nombre minimal de virements.

**Exemple (repris de ton idée) :**

| Indicateur | Montant mensuel |
| --- | --- |
| Total foyer « Appartement » | 1 710,00 € |
| Ma quote-part (50 %) | 855,00 € |
| Revenus | 2 800,00 € |
| Total charges (855 + 90,80 + 12 + 45) | 1 002,80 € |
| Épargne | 400,00 € |
| Reste à vivre | 1 397,20 € |
| Taux de charges | 35,8 % |

J'ai renommé le « % d'endettement » en **taux de charges** : le taux d'endettement désigne en France les seuls remboursements de crédits rapportés aux revenus, ce qui prêterait à confusion.

## Prise en compte par mois

Un board s'affiche toujours pour un mois donné (sélecteur « ‹ octobre 2026 › »). Chaque poste suit une règle de récurrence, et chaque mois peut faire exception : l'électricité facturée un mois sur deux compte en janvier, pas en février.

| Niveau | Champs | Effet | Exemple |
| --- | --- | --- | --- |
| Récurrence | frequency + startMonth | Le poste tombe tous les N mois à partir du mois de référence | Électricité tous les 2 mois depuis janvier : janvier, mars, mai… |
| Mode de prise en compte | allocation : on\_due ou smoothed | À l'échéance : le montant entier le mois où il tombe, 0 € les autres. Lissé : le montant ÷ N chaque mois | 85 € en janvier et 0 € en février, ou 42,50 € chaque mois |
| Période de validité | startMonth, endMonth (facultatif) | Le poste ne compte qu'entre ces deux mois | Salle de sport de septembre à juin |
| Exception du mois | BudgetItemAdjustment (item, period, type, amount) | Force « compter » ou « ne pas compter » pour ce mois, ou un montant réel | Facture d'électricité de mars à 97,40 € au lieu de 85 € |
| Simulation | isActive | Désactive le poste sur tous les mois | Tester le budget sans la salle de sport |

**Exemple, électricité à 85 € tous les 2 mois depuis janvier :**

| Mois | À l'échéance | Lissé |
| --- | --- | --- |
| Janvier | 85,00 € | 42,50 € |
| Février | 0,00 € | 42,50 € |
| Mars (exception : facture réelle) | 97,40 € | 42,50 € |
| Avril | 0,00 € | 42,50 € |

**Montant d'un poste pour le mois M**, dans cet ordre :

1. Poste désactivé (`isActive` = false) → 0.
2. M hors de la période `startMonth` → `endMonth` → 0.
3. Exception pour M : « ne pas compter » → 0 ; montant réel → ce montant ; « compter » → le montant normal, même hors échéance.
4. Sinon, en mode lissé → montant ÷ intervalle ; à l'échéance → le montant si l'écart entre M et `startMonth` est un multiple de l'intervalle, 0 sinon.

Un poste ponctuel devient simplement un poste dont `startMonth` = `endMonth`. Les quotes-parts se calculent sur le montant du mois : ta part d'électricité remonte à 42,50 € en janvier et à 0 € en février dans ton board perso.

**À l'écran :** sur chaque ligne, un menu « Ce mois-ci » propose *Compter*, *Ne pas compter*, *Montant réel…* et *Revenir à la règle*. Une ligne sans échéance ce mois-là reste visible mais grisée, et une pastille « exception » signale un mois modifié.

*Reco : « à l'échéance » par défaut, car il reflète ce qui sort vraiment du compte ce mois-là. Le mode lissé sert aux grosses factures annuelles (taxe foncière, assurance) qu'on préfère provisionner chaque mois.*

## Modèle de données

Le schéma ne doit changer qu'à titre exceptionnel : chaque nouvelle fonctionnalité des lots 2, 3 ou 4 s'ajoute par du code (une nouvelle stratégie) ou par une nouvelle table, jamais en modifiant une colonne existante.

Entités Doctrine, diagrammes de classes et de séquence : Conception Symfony

### Principes

Six principes rendent le modèle fermé aux modifications et ouvert aux extensions.

1. **Séparer la structure des règles.** Un poste (`BudgetItem`) ne porte ni montant ni fréquence : il dit seulement *quoi*. Le *combien*, le *quand* et le *qui paie* vivent dans des révisions datées. La structure ne bouge presque jamais, les règles évoluent sans la toucher.
2. **Dater les règles au lieu de les écraser.** Un loyer qui augmente en janvier crée une nouvelle révision valable à partir de janvier. Les mois passés restent justes, et l'historique est gratuit.
3. **Comportements = stratégies nommées, pas colonnes.** Récurrence, mode de prise en compte, répartition, type d'exception et type de lien sont stockés comme un code texte (`interval`, `on_due`, `percent`…) plus des paramètres. Chaque code correspond à une classe PHP taguée. Un nouveau comportement = une nouvelle classe, sans migration.
4. **Codes en `VARCHAR`, jamais en ENUM natif SQL.** Les enums PHP valident les valeurs connues ; ajouter une valeur ne touche pas la base.
5. **JSON seulement pour les paramètres et l'affichage.** Tout ce qui est filtré, joint, agrégé ou contraint en SQL est une vraie colonne. Le JSON d'une stratégie est validé par sa propre classe.
6. **Les faits sont ajoutés, jamais réécrits.** Révisions, exceptions et événements sont des lignes immuables. On corrige en ajoutant une ligne, ce qui protège les mois déjà consultés et rend les évolutions sûres.

### Vue d'ensemble

&#91;embedded content: modèle en 4 couches · points d'extension en code\]

Plus on descend, plus les lignes sont nombreuses et immuables. Chaque code texte d'une couche (type de board, récurrence, répartition, exception, événement) pointe vers une classe de la colonne de droite.

### Entités et champs

Treize tables pour le budget (seize avec le module ExpenseSplitter), dont `User` et `Tag` déjà présentes dans le socle (`Tag` gagne seulement une colonne `owner_board_id` nullable, à faire dès le lot 1). Toutes les clés sont des UUID v7, tous les montants des entiers en centimes avec leur devise, et toute période est une `DATE` au premier jour du mois (comparable et indexable, via un Value Object `Period`).

| Couche | Entité | Champs | Contraintes et rôle |
| --- | --- | --- | --- |
| Structure | User | existant | Préférences (seuils d'insights…) dans `settings` |
| Structure | Board | owner\_id, type, name, currency, settings, created\_at, updated\_at, archived\_at | `type` en VARCHAR (personal, shared…) ; un seul board `personal` actif par utilisateur |
| Structure | BoardMember | board\_id, user\_id (nullable), display\_name, role, status, joined\_at, left\_at | Unique \[board\_id, user\_id\] ; `role` : owner, editor, viewer ; `status` : invited, active, left |
| Structure | BudgetItem | board\_id, kind, label, position, is\_active, created\_by, created\_at, archived\_at | *Quoi* uniquement : aucun montant ni fréquence ; `kind` : income, expense, savings |
| Structure | Tag + BudgetItemTag | owner\_user\_id ou owner\_board\_id, name, color ; table de liaison item ↔ tag | Un tag appartient à un utilisateur **ou** à un board (règle les tags des boards partagés) ; plusieurs tags par poste possibles |
| Règles datées | BudgetItemRevision | item\_id, effective\_from, end\_period, amount\_cents, currency, recurrence\_type, recurrence\_params, allocation, due\_day, paid\_by\_member\_id, created\_by, created\_at | Immuable ; unique \[item\_id, effective\_from\] ; la règle du mois M = la dernière révision avec effective\_from ≤ M |
| Règles datées | SplitRule + SplitRuleEntry | board\_id, item\_id (nullable), effective\_from, strategy ; entrées : member\_id, value | `item_id` vide = règle du board ; sinon répartition propre au poste. Le sens de `value` dépend de la stratégie (vide pour equals, centimes pour amount, points de base pour percentage) |
| Règles datées | BoardLink | source\_board\_id, target\_board\_id, member\_id, type, params, active\_from, active\_to | Généralise la remontée : `share_rollup` = la part d'un membre remonte dans son board perso. Créé quand une invitation est acceptée |
| Exceptions | BudgetItemAdjustment | item\_id, period, type, amount\_cents, params, note, created\_by, created\_at | Unique \[item\_id, period\] ; `type` : exclude, include, amount… |
| Journal | DomainEvent | aggregate\_type, aggregate\_id, type, payload, actor\_id, occurred\_at | Ajout seul, jamais modifié ; index \[aggregate\_type, aggregate\_id, occurred\_at\] |
| Faits (ExpenseSplitter) | Expense | board\_id, paid\_by\_member\_id, label, amount\_cents, currency, spent\_on, split\_strategy, tag\_id, supersedes\_id, voided\_at, created\_by, created\_at | Une dépense réelle et datée ; corriger = nouvelle dépense qui remplace l'ancienne |
| Faits (ExpenseSplitter) | ExpenseShare | expense\_id, member\_id, amount\_cents, input\_value | Immuable ; somme des parts = montant de la dépense ; unique \[expense\_id, member\_id\] ; input\_value garde la saisie (centimes en amount, points de base en percentage, vide en equals) |
| Faits (ExpenseSplitter) | Settlement | board\_id, from\_member\_id, to\_member\_id, amount\_cents, currency, settled\_on, note, voided\_at, created\_by, created\_at | Un remboursement entre deux participants ; annuler = voided\_at, jamais de suppression |
| Structure | Invitation | board\_id, member\_id, invited\_by, email (nullable), channel, token\_hash, status, expires\_at, max\_uses, use\_count, accepted\_by, accepted\_at, created\_at | Une seule entité pour inviter dans un board partagé ou un groupe de dépenses (les deux sont des Board) ; channel : email ou link ; status : pending, accepted, declined, revoked, expired ; seul le hash du token est stocké |

**Correspondance avec la section Prise en compte par mois :** `startMonth` devient l'ancre de la récurrence (`recurrence_params.anchor`), `endMonth` devient `end_period`, et l'exception du mois est une ligne de `BudgetItemAdjustment`.

**Calcul du montant d'un poste pour le mois M**, sous forme d'une chaîne de services tagués :

1. `RevisionResolver` trouve la révision en vigueur en M.
2. Le `RecurrenceHandler` de son `recurrence_type` dit si le poste tombe en M.
3. L'`AllocationHandler` de son `allocation` donne le montant du mois (entier ou lissé).
4. L'`AdjustmentHandler` du type d'exception éventuelle l'applique.
5. La `SplitStrategy` de la règle de répartition en vigueur calcule la part de chaque membre.
6. Le `BoardLinkHandler` de chaque lien fait remonter les parts dans les boards cibles.

### Évolutions absorbées sans toucher au schéma

Chaque évolution envisagée se règle par une nouvelle classe, une nouvelle valeur ou, au pire, une nouvelle table. Aucune ne modifie une colonne existante.

| Lot | Évolution | Comment elle s'ajoute | Schéma |
| --- | --- | --- | --- |
| 2 | Le loyer augmente en janvier | Nouvelle `BudgetItemRevision` à partir de janvier | Inchangé |
| 2 | Facture à des mois précis (taxe foncière en octobre) | `recurrence_type` = `specific_months` + sa classe `RecurrenceHandler` | Inchangé |
| 2 | Répartition au prorata des revenus | `SplitStrategy` `income_prorata`, calculée depuis les boards perso | Inchangé |
| 2 | Invitation d'un compte existant | `BoardMember.status` = invited, puis création d'un `BoardLink` à l'acceptation | Inchangé |
| 2 | Masquer ou reporter un insight | Nouvelle table `InsightState` (user, rule\_key, period, status) | Table ajoutée |
| 3 | Historique « ce qui a changé », annulation | Lecture de `DomainEvent` | Inchangé |
| 3 | Board objectif d'épargne (vacances) | `Board.type` = goal + un `BoardLink` `savings_rollup` | Inchangé |
| 3 | Plusieurs devises | Colonnes `currency` déjà présentes ; taux de change dans une nouvelle table | Table ajoutée |
| 3 | Notifications (e-mail, push) | Abonnement aux `DomainEvent` + table `Notification` | Table ajoutée |
| 4 | Import bancaire et pointage | Tables `Transaction` et `TransactionMatch` (transaction ↔ poste + période) | Tables ajoutées |
| 4 | Pièces jointes (facture PDF) | Table `Attachment` liée à un poste ou une exception | Table ajoutée |

Le calcul suit la même logique : une nouvelle stratégie s'enregistre via le tag Symfony, et `BoardCalculatorService` la découvre sans être modifié.

### Contrat de schéma

Une migration doit rester un événement rare et décidé, pas un geste de routine. La règle : on ajoute, on ne modifie pas.

| Extension, autorisée | Modification, interdite hors version majeure |
| --- | --- |
| Nouvelle table | Renommer ou supprimer une colonne ou une table |
| Nouvelle colonne nullable ou avec valeur par défaut | Changer le type ou le sens d'une colonne |
| Nouvelle valeur dans un code `VARCHAR` (type, stratégie, statut) | Rendre obligatoire une colonne facultative |
| Nouvelle clé de paramètre JSON, avec valeur par défaut côté code | Réécrire des montants, révisions ou exceptions déjà enregistrés |
| Nouvel index | Utiliser un type ENUM natif SQL |

**Garde-fous :**

- Toute migration s'accompagne d'une courte fiche de décision (ADR) dans le dépôt : pourquoi le schéma change, et pourquoi une stratégie ne suffisait pas.
- Une migration est réversible (`down()` écrit et testé) et n'est jamais mélangée à une réécriture de données métier.
- Chaque stratégie valide ses propres paramètres JSON et a ses tests unitaires ; une valeur de code inconnue lève une erreur explicite au lieu d'être ignorée.
- Les révisions, exceptions et événements ne sont jamais modifiés en place : une correction est une nouvelle ligne, et elle produit un `DomainEvent`.

## API et écrans

L'API expose trois ressources imbriquées (boards, membres, postes). `GET /api/boards/{id}` renvoie le board déjà calculé, prêt à afficher.

| Méthode | Route | Rôle |
| --- | --- | --- |
| GET | /api/boards | Mes boards (perso + partagés dont je suis membre) avec leurs totaux |
| POST | /api/boards | Créer un board perso ou partagé |
| GET | /api/boards/{id} | Détail calculé : postes groupés par type et tag, parts, équilibre ou reste à vivre |
| PUT | /api/boards/{id} | Renommer, modifier les settings |
| DELETE | /api/boards/{id} | Supprimer |
| POST | /api/boards/{id}/members | Ajouter un membre (e-mail d'un inscrit ou prénom) |
| PUT | /api/boards/{id}/members/{memberId} | Modifier sa part |
| DELETE | /api/boards/{id}/members/{memberId} | Retirer un membre |
| POST | /api/boards/{id}/items | Ajouter un poste |
| PUT | /api/boards/{id}/items/{itemId} | Modifier un poste |
| PATCH | /api/boards/{id}/items/{itemId}/toggle | Activer ou désactiver (simulation) |
| DELETE | /api/boards/{id}/items/{itemId} | Supprimer un poste |
| GET | /api/boards/{id}?month=AAAA-MM | Board calculé pour un mois donné (mois en cours par défaut) |
| PUT | /api/boards/{id}/items/{itemId}/months/{month} | Exception du mois : compter, ne pas compter ou montant réel |
| DELETE | /api/boards/{id}/items/{itemId}/months/{month} | Retirer l'exception et revenir à la règle |
| POST | /api/invitations/{token}/accept | Accepter une invitation : la part remonte dans son board perso |
| GET | /api/insights?month=AAAA-MM | Données de la page d'accueil (KPI, insights, à venir, boards partagés) |
| POST | /api/boards/{id}/invitations | Inviter par e-mail ou créer un lien d'invitation (board partagé ou groupe de dépenses) |
| GET | /api/invitations/{token} | Aperçu avant acceptation : nom du board, qui invite, expiration |
| DELETE | /api/boards/{id}/invitations/{invitationId} | Révoquer une invitation en attente |

Les droits passent par un **`BoardVoter`** (VIEW, EDIT, MANAGE\_MEMBERS) : un membre ne voit que ses boards, et seul le propriétaire gère les membres.

**Écrans React (sidebar) :**

- **Mes boards :** Mon budget (board perso), puis un item par board partagé, généré depuis `GET /api/boards` et non codé en dur.
- **Organisation :** Tags & catégories.
- **Outils (dev / admin) :** aperçu des e-mails, journaux de logs.

**Écran d'un board :** KPI en haut (revenus, charges, épargne, reste à vivre), puis une section par type de poste. Les parts remontées des boards partagés s'affichent groupées ou détaillées (switch), avec leurs tags. Une case par ligne active ou désactive le poste et recalcule tout immédiatement.

## Accueil — page Insights

La page d'accueil (`/`, premier item de la sidebar, page d'arrivée après connexion) répond d'abord à « combien me reste-t-il ce mois-ci ? », puis à « qu'est-ce qui mérite mon attention ? ». Elle suit le mois choisi dans le sélecteur, comme les boards.

&#91;embedded content: page d'accueil · maquette fil de fer\]

Les montants reprennent l'exemple du doc ; le graphique et les barres sont des emplacements, pas des données.

| Bloc | Contenu | Version |
| --- | --- | --- |
| KPI du mois | Revenus, charges (dont part commune), épargne, reste à vivre, écart avec le mois précédent | V1 |
| À surveiller | Messages générés par des règles (voir ci-dessous), du plus urgent au moins urgent | V1 |
| À venir ce mois-ci | Postes qui tombent ce mois, triés par jour de prélèvement, avec la part de l'utilisateur | V1 |
| Boards partagés | Par board : total foyer, ma part, versement à faire ou remboursement à recevoir | V2 |
| Charges par tag | Répartition des charges du mois par tag, aux couleurs des tags | V2 |
| Évolution | Reste à vivre et charges sur 12 mois : 6 passés, 6 projetés grâce aux règles de récurrence | V3 |

**Règles d'insights** (une classe par règle, enregistrée automatiquement : ajouter un insight ne modifie pas le service) :

- **Reste à vivre négatif** ce mois-ci → alerte.
- **Taux de charges au-dessus d'un seuil** choisi dans les réglages → avertissement.
- **Grosse échéance dans les 2 prochains mois** (poste à l'échéance au-dessus d'un montant, ex. taxe foncière) → « pensez à provisionner ».
- **Facture non mensuelle qui tombe ce mois** (électricité un mois sur deux) → information.
- **Versement au compte commun** à faire en début de mois → rappel avec le montant.
- **Exception de mois oubliée** (montant réel non saisi pour une facture variable déjà échue) → suggestion.

**API :** `GET /api/insights?month=AAAA-MM` renvoie en un appel les KPI, les insights `{ key, level, message, link }`, les postes à venir et le résumé des boards partagés. Chaque règle implémente une `InsightRuleInterface` taguée (`supports()`, `evaluate()`), sur le même modèle Open/Closed que le reste du projet. Les calculs réutilisent `BoardCalculatorService`, rien n'est recalculé côté React.

## Module ExpenseSplitter — dépenses partagées

Un groupe de dépenses à la Tricount : chacun saisit ce qu'il a payé pendant les vacances, et l'application dit **qui doit combien à qui** avec le moins de virements possible. Contrairement aux boards de budget, on enregistre ici des **dépenses réelles et datées**, pas des règles récurrentes.

| Notion | Définition | Exemple |
| --- | --- | --- |
| Groupe | Un board de type `expense_group`, avec sa devise | « Vacances Biarritz », EUR |
| Participant | Un membre du groupe : compte de l'appli ou simple prénom | Toi, ta partenaire, Alex |
| Dépense | Qui a payé, combien, quand, pour quoi, et entre qui on la partage | Frédérick paie la location : 600 € |
| Répartition | Trois modes : parts égales (equals), montant défini par membre (amount), pourcentage défini par membre (percentage) | Restaurant partagé entre 2 personnes sur 3 |
| Solde | Ce qu'un participant a payé − ce qu'il doit, corrigé des remboursements | +320 € : on lui doit 320 € |
| Remboursement | Un virement enregistré entre deux participants, qui ramène les soldes vers zéro | Alex rembourse 190 € à Frédérick |

### Modes de répartition

Chaque dépense choisit l'un des trois modes. Dans tous les cas, la somme des parts vaut exactement le montant de la dépense, au centime près.

| Mode (code) | Saisie | Règle de validation | Exemple : restaurant à 90,00 € |
| --- | --- | --- | --- |
| Parts égales (`equals`) | Les membres concernés, cases à cocher | Au moins un membre ; montant ÷ nombre de membres | 30,00 + 30,00 + 30,00 |
| Montant (`amount`) | Une somme par membre, en euros | La somme des montants = le montant de la dépense, sinon refus (422) | 50,00 + 25,00 + 15,00 |
| Pourcentage (`percentage`) | Un pourcentage par membre, jusqu'à 2 décimales | La somme = 100 %, sinon refus (422) | 50 % + 30 % + 20 % = 45,00 + 27,00 + 18,00 |

- **Stockage :** les pourcentages sont des entiers en points de base (12,5 % = 1 250, total 10 000), les montants des entiers en centimes. Aucun float.
- **Arrondis :** en `equals` et `percentage`, le centime restant (100 € entre 3 = 33,34 + 33,33 + 33,33) va à un membre choisi de façon déterministe. En `amount`, il n'y a rien à arrondir.
- **Membre à 0 :** un membre non coché, à 0 € ou à 0 % ne reçoit pas de part.
- **Formulaire :** un sélecteur à trois choix. En `amount` et `percentage`, l'écran affiche en direct « reste à répartir : X € » ou « X % », et bloque l'enregistrement tant qu'il n'est pas à 0.
- **Évolution :** chaque mode est une classe `SplitStrategy`. Un quatrième mode (parts pondérées, prorata des revenus) s'ajoutera comme une nouvelle classe, sans toucher aux trois premiers ni au schéma.

Les boards partagés du budget utilisent les mêmes trois modes : 50/50 = `equals`, 60/40 = `percentage`, et un montant fixe par personne sur une ligne = `amount`.

### Qui doit combien à qui

Exemple : trois participants, toutes les dépenses partagées à parts égales (840 €, soit 280 € chacun).

| Participant | A payé | Doit | Solde |
| --- | --- | --- | --- |
| Frédérick | 600,00 € (location) | 280,00 € | +320,00 € |
| Partenaire | 150,00 € (courses) | 280,00 € | −130,00 € |
| Alex | 90,00 € (restaurant) | 280,00 € | −190,00 € |

**Virements proposés :** Alex → Frédérick 190,00 €, puis Partenaire → Frédérick 130,00 €.

1. **Solde d'un participant** = total payé − total de ses parts + remboursements envoyés − remboursements reçus. La somme des soldes du groupe vaut toujours 0.
2. **Plan de virements :** on associe à chaque étape le plus gros créancier au plus gros débiteur, pour le montant le plus petit des deux, jusqu'à ce que tout soit à zéro. On obtient au plus n − 1 virements pour n participants, dans un ordre déterministe.
3. **Arrondis :** 100 € entre 3 donne 33,34 + 33,33 + 33,33 ; le centime restant suit la même règle déterministe que les boards.
4. **Enregistrer un remboursement** (« marquer comme payé ») met les soldes à jour sans toucher aux dépenses.

### Fonctionnalités

| Fonctionnalité | Détail | Lot |
| --- | --- | --- |
| Groupes | Créer, renommer, clôturer (archiver) ; devise du groupe | 2 |
| Participants | Ajouter un compte existant ou un simple prénom ; réutilise l'invitation des boards | 2 |
| Dépenses | Payeur, montant, date, libellé, tag, participants concernés, mode de répartition | 2 |
| Soldes et plan de virements | Vue « Équilibres » avec les virements proposés | 2 |
| Remboursements | Marquer un virement comme fait, ou saisir un remboursement libre | 2 |
| Statistiques | Dépenses par tag et par personne, total du séjour | 3 |
| Dépense en devise étrangère | Montant d'origine + taux saisi, converti dans la devise du groupe | 3 |
| Remontée dans le budget perso | Ma part des dépenses du mois apparaît dans mon board perso, via un `BoardLink` `expense_rollup` | 3 |
| Photos de tickets | Pièce jointe sur une dépense (table `Attachment`) | 4 |
| Lien d'invitation public | Rejoindre un groupe sans compte, par un lien signé | 4 |

### Ce que le module réutilise, ce qu'il ajoute

Le module ne modifie aucune table existante : il réutilise la structure et ajoute trois tables de faits.

| Réutilisé tel quel | Ajouté |
| --- | --- |
| `Board` (type `expense_group`), `BoardMember`, `Tag`, `DomainEvent` | `Expense` : groupe, payeur, montant, date, libellé, stratégie de répartition |
| Stratégies `SplitStrategy` (equals, amount, percentage) | `ExpenseShare` : la part de chaque participant, figée à l'enregistrement |
| `BoardVoter`, invitation, `BoardLink` pour la remontée dans le budget | `Settlement` : un remboursement d'un participant à un autre |
| `BalanceCalculator`, déjà utilisé pour l'équilibre des boards partagés | — |

Une dépense est un fait : sa répartition est calculée une fois et stockée dans `ExpenseShare`, pour qu'un participant ajouté plus tard ne change pas les dépenses déjà partagées. Corriger une dépense crée une nouvelle dépense qui remplace l'ancienne (`supersedes_id`), et l'ancienne est marquée annulée.

**API :**

| Méthode | Route | Rôle |
| --- | --- | --- |
| GET, POST | /api/expense-groups | Mes groupes, créer un groupe |
| GET, PUT, DELETE | /api/expense-groups/{id} | Détail, renommer, clôturer |
| GET, POST | /api/expense-groups/{id}/expenses | Lister (filtres date, tag, payeur), ajouter |
| PUT, DELETE | /api/expense-groups/{id}/expenses/{expenseId} | Corriger (remplacement), annuler |
| GET | /api/expense-groups/{id}/balances | Soldes et virements proposés |
| POST, DELETE | /api/expense-groups/{id}/settlements | Enregistrer ou annuler un remboursement |

**Écrans :** une liste des groupes, puis un groupe en trois onglets : *Dépenses* (liste chronologique, bouton « + Dépense »), *Équilibres* (soldes et virements, bouton « Marquer comme payé »), *Statistiques*. L'accueil peut afficher un insight « Tu dois 130 € à Frédérick (Vacances Biarritz) ».

## Réutilisation du socle existant

L'essentiel du compte utilisateur existe déjà (API Symfony, React/TypeScript, `core-php`). Le nouveau travail se concentre sur les boards.

| Brique | État | Adaptation pour l'app Budget |
| --- | --- | --- |
| Inscription, connexion JWT, mot de passe oublié | Existant | Créer automatiquement le board perso à l'activation du compte |
| Profil, avatar, changement d'e-mail, suppression du compte | Existant | À la suppression : retirer l'utilisateur des boards partagés, le convertir en invité local plutôt que d'effacer le board des autres |
| Tags colorés (`ColorEnum`, unique par `[owner, color]`) | Existant | Limite de 13 tags par utilisateur, une couleur chacun ; décider à qui appartiennent les tags d'un board partagé |
| `EmailDispatcherService` + DTOs d'e-mails | Existant | Ajouter `BoardInvitationMailDto` |
| Aperçu des e-mails | À créer | Rendu HTML sans envoi, dans une iframe desktop / mobile, réservé à l'environnement dev ou aux admins |
| Explorateur de logs | À créer | Lecture des fichiers JSON de `LoggerTrait`, filtres date / canal / niveau, réservé admin |

Les outils d'aperçu et de logs exposent des données sensibles : routes désactivées en production ou protégées par `ROLE_ADMIN`, et lecture de fichiers limitée au dossier de logs (pas de chemin fourni par le client).

## Points à trancher

Ces décisions changent le modèle de données : mieux vaut les prendre avant la première migration. Ma recommandation suit chaque question.

- [x] **Dépenses ponctuelles :** à quel mois s'appliquent-elles ? Dans le calcul initial, un achat ponctuel compte comme une charge mensuelle permanente. *Reco : un champ `month`, compté uniquement pour ce mois-là. Tranché : un ponctuel = startMonth égal à endMonth.*
- [x] **Budget type ou budget par mois ?** Avec des ponctuels datés, il faut savoir quel mois on regarde. *Reco V1 : un budget type, plus un sélecteur de mois qui ajoute les ponctuels de ce mois. Tranché : board affiché par mois, règles de récurrence et exceptions mensuelles.*
- [ ] **Un seul board perso par utilisateur ?** *Reco : oui en V1, ce qui supprime `targetPersonalBoard`.*
- [ ] **Ajout d'un compte existant :** la part remonte-t-elle sans son accord ? *Reco : invitation par e-mail à accepter ; avant acceptation, le membre se comporte comme un invité local.*
- [ ] **Qui modifie un board partagé ?** *Reco : tous les membres liés modifient les postes, seul le propriétaire gère les membres et supprime le board.*
- [ ] **Tags sur un board partagé :** les tags appartiennent à un utilisateur et ta partenaire ne voit pas les tiens. *Reco : chacun voit le tag posé par l'auteur de la ligne, en lecture seule, ou des tags propres au board.*
- [ ] **Revenus et épargne sur un board partagé ?** (épargne commune, aides au logement). *Reco : épargne autorisée, revenus réservés au board perso en V1.*
- [x] **Invité local qui crée un compte plus tard :** prévoir de le lier au membre existant sans perdre son historique. Tranché : une Invitation peut viser un membre invité existant ; à l'acceptation, le compte est rattaché à ce membre.
- [ ] **Cohérence de l'exemple :** l'assurance habitation apparaît à 20 €/mois dans le schéma et à 180 €/an (15 €/mois) dans le texte. À aligner dans les fixtures.

## Roadmap

La V1 doit déjà répondre à la question de départ, « combien me reste-t-il vraiment chaque mois ? », même si ta partenaire n'utilise pas encore l'application.

| Version | Contenu | Terminée quand… |
| --- | --- | --- |
| V1 — Mon budget | Board perso créé à l'activation ; board partagé avec membres invités locaux ; postes, fréquences, tags, activation d'une ligne ; remontée groupée de la quote-part ; KPI et reste à vivre ; accueil Insights (KPI, à surveiller, à venir) | Ton budget réel est saisi et le reste à vivre affiché correspond à ton calcul manuel |
| V2 — Foyer connecté | Invitation d'un compte existant ; part qui remonte dans le board perso de chaque membre ; répartition par ligne ; payeur et bilan d'équilibre ; affichage détaillé | Ta partenaire voit sa propre part dans son board, et la phrase d'équilibre est juste sur un mois réel |
| V3 — Confort | Historique mensuel et comparaison ; graphiques par tag ; export CSV ou PDF ; aperçu des e-mails et explorateur de logs | Selon tes priorités |
| Module ExpenseSplitter | Groupes, participants, dépenses, soldes, plan de virements, remboursements ; puis statistiques, devises, remontée dans le budget perso | Peut démarrer dès la fin de la V1 : il ne dépend que de Board, BoardMember et SplitStrategy. Terminé quand un week-end réel est soldé avec les virements proposés |

Une bonne pratique pour la V1 : écrire d'abord les **tests unitaires de `BoardCalculatorService`** avec l'exemple chiffré ci-dessus et les cas d'arrondi. C'est le cœur de l'application et la partie la plus facile à casser sans s'en rendre compte.
