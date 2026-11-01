# Module Admin — Front

Compte rendu des écrans d'administration de `budget_front` : aperçu des e-mails et explorateur de logs. État au 28 octobre 2026.

Côté API : [specs/api/admin.md](../api/admin.md). Architecture commune : [socle.md](socle.md).

## Accès

- Les routes `/admin/*` passent par `ProtectedRoute` puis `AdminRoute` : un utilisateur sans `ROLE_ADMIN` est renvoyé vers `/`.
- La section « Administration » de la barre latérale (E-mails, Logs) n'apparaît que pour les administrateurs.
- `/admin` redirige vers `/admin/emails`.

## Aperçu des e-mails — `/admin/emails`

`EmailPreviewPage`, sous-titrée « Rendu des templates d'e-mails avec des données factices (aucun envoi) ».

- **Colonne de gauche** : la liste des e-mails de `GET /api/admin/emails`, avec libellé et description. Le premier est sélectionné au chargement.
- **Zone principale** : l'expéditeur (« De »), le destinataire (« À ») et l'objet, puis le rendu HTML de `GET /api/admin/emails/{slug}`, avec un bouton « Recharger ».
- Le HTML s'affiche dans une `iframe` `srcDoc` avec `sandbox=""` : aucun script ni aucune navigation ne peut partir du contenu de l'e-mail.
- Sous `md`, les deux colonnes s'empilent.

Les huit e-mails du projet y figurent, dont l'invitation dans un board ajoutée par le module Budget.

## Explorateur de logs — `/admin/logs`

`LogsPage`, sous-titrée « Journaux JSON générés par le Logger, groupés par date et par fichier ».

**Navigation** :

- un sélecteur de date (format long en français, par exemple « mardi 27 octobre 2026 ») ;
- l'arborescence des dossiers et fichiers de la date (`LogTree`) ;
- « Actualiser » recharge l'arborescence et le fichier ouvert.

**Lecture d'un fichier** :

- Filtre par niveau (Tous, Debug, Info, Notice, Warning, Error, Critical) et recherche libre dans le contenu et le contexte de chaque entrée. Les deux se réinitialisent à l'ouverture d'un autre fichier.
- Les entrées s'affichent en accordéon (`LogEntryItem`). L'en-tête montre l'icône et le badge du niveau ainsi que la date au format français.
- Le détail d'une entrée est découpé en sections : Utilisateur, Action, Message, Exception, Données, Requête, Réponse, SQL, Autres données, Informations techniques (appareil, réseau et IP, requête, fichier, user agent).

**Exceptions** (`LogExceptionDetails`) : classe, message, `fichier:ligne`, puis la pile d'appels.

- Seuls les appels du code de l'application s'affichent par défaut ; « Afficher vendor (n) » montre aussi ceux des dépendances.
- Le nombre d'appels non conservés est indiqué.
- Les exceptions chaînées s'affichent sous « Causée par : ».

États vides : « Aucun log » quand il n'y a aucun fichier, une invitation à choisir un fichier, « Aucune entrée » quand les filtres ne laissent rien.

## Où trouver le code

| Fichier | Rôle |
| --- | --- |
| `src/pages/admin/EmailPreviewPage.tsx` | Aperçu des e-mails |
| `src/pages/admin/LogsPage.tsx` | Explorateur de logs |
| `src/pages/admin/components/LogTree.tsx` | Arborescence des fichiers |
| `src/pages/admin/components/LogEntryItem.tsx` | Une entrée de log |
| `src/pages/admin/components/LogExceptionDetails.tsx` | Exception et pile d'appels |
| `src/pages/admin/components/logFormat.ts` | Niveaux, icônes, dates, détection des exceptions et des appels `vendor/` |
| `src/services/emailPreview.api.ts`, `src/services/log.api.ts` | Appels à l'API |
| `src/types/emailPreview.types.ts`, `src/types/log.types.ts` | Types |
| `src/router/adminRoute.tsx` | Garde `ROLE_ADMIN` |

## Vérifications

`logFormat.test.ts` et `logException.test.ts` passent avec le reste de `npm test`. Les écrans n'ont pas été rejoués dans un navigateur dans cette session.
