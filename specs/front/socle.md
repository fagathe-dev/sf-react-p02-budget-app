# Socle du front

Compte rendu de l'architecture commune de `budget_front` : routage, session, appels à l'API, mises en page, thème, design system et tests. État au 28 octobre 2026.

Fonctionnalités : [auth.md](auth.md) (connexion, inscription, liens reçus par e-mail, profil) et [admin.md](admin.md) (aperçu des e-mails, logs).

## État

Le front contient le socle repris de `sf-react-p01-base-app` : authentification complète, profil, administration. **Aucun écran du budget n'est encore développé.**

- La route `/` redirige vers `/profile`, en attendant la page d'accueil Insights.
- La section « Espaces de travail » de la barre latérale (`PRIMARY_MODULES`) est vide, donc masquée.

Les endpoints du budget sont prêts côté API : voir [specs/api/budget.md](../api/budget.md), [insights.md](../api/insights.md) et [expense-splitter.md](../api/expense-splitter.md).

## Stack

Versions installées : React 19.3, Vite 8.3 avec React Compiler (plugin Babel), TypeScript 6.0, react-router-dom 7.18, zustand 5, styled-components 6.6, react-hook-form avec zod 4.6, axios 1.21, vitest 5 avec jsdom et Testing Library. Les dépendances `core-ts` viennent de GitHub.

## Arborescence

| Dossier | Rôle |
| --- | --- |
| `src/ui/` | Design system (composants, thème, documentation dans `src/ui/docs/`) |
| `src/services/` | Appels HTTP : `fetchAPI.ts`, `apiError.ts`, un fichier `<module>.api.ts` par domaine |
| `src/types/` | Types partagés, `<module>.types.ts` |
| `src/stores/` | Stores zustand (`auth.store.ts`) |
| `src/hooks/` | Hooks transverses, exportés par `hooks/index.ts` |
| `src/pages/<module>/` | Pages, `components/`, schémas zod, barrel `index.ts` |
| `src/layouts/` | `AppLayout` (espace connecté) et `AuthLayout` (pages publiques) |
| `src/router/` | Routeur et gardes |
| `src/utils/` | Fonctions pures et leurs tests |

Les imports passent par l'alias `@/` (vers `src/`), et chaque dossier expose un barrel `index.ts`.

## Routage

`src/router/index.tsx` utilise `createBrowserRouter`.

| Route | Garde | Mise en page | Page |
| --- | --- | --- | --- |
| `/` | `ProtectedRoute` | `AppLayout` | Redirection vers `/profile` |
| `/profile` | `ProtectedRoute` | `AppLayout` | `ProfilePage` |
| `/admin` | `ProtectedRoute` > `AdminRoute` | `AppLayout` | Redirection vers `/admin/emails` |
| `/admin/emails` | `ProtectedRoute` > `AdminRoute` | `AppLayout` | `EmailPreviewPage` |
| `/admin/logs` | `ProtectedRoute` > `AdminRoute` | `AppLayout` | `LogsPage` |
| `/logout` | `ProtectedRoute` | — | `LogoutPage` |
| `/login` | `PublicRoute` | `AuthLayout` | `LoginPage` |
| `/register` | `PublicRoute` | `AuthLayout` | `RegisterPage` |
| `/forgot-password` | `PublicRoute` | `AuthLayout` | `ForgotPasswordPage` |
| `/verify-email?token=` | Aucune | `AuthLayout` | `VerifyEmailPage` |
| `/reset-password?token=` | Aucune | `AuthLayout` | `ResetPasswordPage` |
| `/confirm-email-change?token=` | Aucune | `AuthLayout` | `ConfirmEmailChangePage` |
| `*` | — | — | Redirection vers `/` |

Les gardes :

- `ProtectedRoute` affiche « Vérification de la session… » pendant le chargement, puis renvoie vers `/login` sans jeton.
- `PublicRoute` renvoie vers `/` quand on est déjà connecté.
- `AdminRoute`, placée sous `ProtectedRoute`, renvoie vers `/` si l'utilisateur n'a pas `ROLE_ADMIN`.
- Les trois pages ouvertes depuis un e-mail n'ont pas de garde : le jeton du lien suffit, connecté ou non.

## Session

`src/stores/auth.store.ts` (zustand) garde `token`, `user` et `isLoading`.

- Le JWT est stocké dans le `localStorage` sous la clé `budget_auth_token` (via `StorageService` de `core-ts`).
- Au démarrage, `App` appelle `checkSession()`. Un jeton absent ou expiré (date `exp` lue localement par `utils/jwt.ts`) déconnecte tout de suite ; sinon, le profil est chargé par `GET /api/account/profile`, et un échec déconnecte aussi.
- `setAuth(token, user)` enregistre une session, `setUser(user)` met à jour l'utilisateur après une modification du profil, `logout()` efface tout.

`useAuth()` expose `isAuth`, `user`, `role`, `isAdmin`, `roleLabel` (« Utilisateur » ou « Administrateur »), `isLoading`, `token` et `logout`.

## Appels à l'API

`fetchAPI<T>(endpoint, { method, body, headers, responseType })` dans `src/services/fetchAPI.ts` :

- préfixe l'URL avec `VITE_API_URL` ;
- ajoute `Authorization: Bearer <jeton>` si un jeton est stocké ;
- envoie le corps en JSON (sauf `FormData`, `Blob`, `URLSearchParams` ou chaîne) ;
- ne lève jamais d'exception sur un code HTTP et renvoie `{ ok, status, headers, data | text | blob }`. Un 204 donne `data: null`.

Chaque service vérifie `res.ok`, puis lève `toApiError(res, 'message par défaut')` en cas d'échec (`src/services/apiError.ts`). `ApiError` porte :

| Champ | Contenu |
| --- | --- |
| `message` | `message` de l'API, sinon les violations jointes, sinon le message par défaut |
| `status` | Code HTTP |
| `violations` | `{ champ: message }` renvoyé par `sendViolations()` |
| `code` | Code métier, par exemple `email_not_verified` |

Fonctions utilitaires : `getErrorMessage(err, défaut)`, `getFieldErrors(err)` (pour `setError` de react-hook-form) et `getErrorCode(err)`.

Les secrets (mots de passe) sont encodés par `encodeSecret()` (`utils/secret.ts`, base64 UTF-8) avant l'envoi, comme l'attend l'API.

Services existants : `auth.api.ts` (authentification et compte), `emailPreview.api.ts`, `log.api.ts`.

## Mises en page

**`AppLayout`**, l'espace connecté :

- Barre latérale de 260 px (repliable sous `md`) avec le logo, la section « Espaces de travail » (`PRIMARY_MODULES`, vide pour l'instant) et la section « Administration » pour les administrateurs (E-mails, Logs). En pied, l'avatar, le nom, l'e-mail et le rôle.
- Barre du haut collante : bouton de repli et « Mon Espace », puis le menu du compte (résumé, « Mon profil », sélecteur d'apparence, « Se déconnecter »).
- Contenu dans une zone défilante, 1 500 px de large au plus.

**`AuthLayout`** : une carte centrée avec le logo et « Budget App », pour la connexion, l'inscription et les pages ouvertes depuis un e-mail.

## Thème

`useTheme()` (`src/hooks/useTheme.ts`) s'appuie sur un store zustand persisté (`ds-app-theme`) :

- préférence `light`, `dark` ou `system` ; `system` suit le réglage du système d'exploitation en direct ;
- le mode résolu est posé sur `<html>` (`data-theme`, `data-ds-theme`, `color-scheme`) ;
- `ThemeModeSwitcher`, dans le menu du compte, change la préférence.

Les styles passent par les tokens du thème (`src/ui/theme`), via styled-components.

## Design system

`src/ui/components/` regroupe les composants à réutiliser avant d'en créer :

| Famille | Composants |
| --- | --- |
| Base | Avatar, Badge, Button, Divider, Icon, IconButton, Link, SegmentedControl |
| Content | Accordion, Card, EmptyState, ListGroup, StatCard, Table |
| Editor | BlockPicker, blocs image, vidéo et carrousel |
| Embed | Carousel, Gallery, Figure, Image, Video |
| Feedback | Alert, Drawer, Loading, Modal, Progress, Skeleton, Toast, Tooltip |
| Forms | Fields, Input, Select, Textarea, Checkbox, Radio, Toggle, Label, HelperText, FileDropzone, InputGroup, TagInput |
| Grid | Container, Row, Col, Columns, Flex, Grid |
| Navigation | BackButton, Breadcrumb, Dropdown, Navbar, Pagination, Sidebar, Tabs, ThemeModeSwitcher |
| Typo | Display, Lead, Text, Title |

La documentation d'usage se trouve dans `src/ui/docs/` : une fiche par famille, plus `theme_usage.md` et `features/editor_usage.md`. Les noms d'icônes utilisés (`account-outline`, `logout`…) sont ceux de Material Design Icons ; les polices d'icônes sont servies depuis `public/assets/`.

## Hooks et utilitaires

| Élément | Rôle |
| --- | --- |
| `useAuth` | Session et rôle (voir plus haut) |
| `useTheme` | Thème clair, sombre ou système |
| `useActionTimer` | `setTimeout` ou `setInterval` déclaratif ; `delay: null` met en pause |
| `useClipboard` | Copie dans le presse-papiers avec retour « copié » temporaire |
| `useToggle` | Booléen à bascule |
| `utils/jwt.ts` | Décodage du JWT et contrôle de son expiration |
| `utils/role.ts` | Rôle principal et libellé |
| `utils/secret.ts` | Encodage base64 des secrets |
| `utils/string.ts` | `truncateWords` |

## Tests et commandes

```bash
npm run dev       # serveur de développement (http://localhost:5173)
npm test          # vitest run
npm run build     # tsc -b puis vite build
```

Le 28 octobre 2026 : `npm test` passe (8 fichiers, 92 tests) et `tsc -b --noEmit` ne signale aucune erreur. Les fichiers de test couvrent :

- `utils/` : jwt, role, secret, string ;
- `hooks/useActionTimer` ;
- les schémas d'authentification (`pages/auth/authSchemas`) ;
- le formatage des logs (`pages/admin/components/logFormat`, `logException`).

`npm run lint` est cassé tant que typescript-eslint ne prend pas en charge la version de TypeScript du projet.

## Ajouter le module budget

Étapes prévues par les conventions du dépôt (`SKILL.md`) :

1. Types (`types/budget.types.ts`) et service (`services/budget.api.ts`) à partir des fiches de l'API.
2. Store zustand si l'état est partagé entre plusieurs pages (mois affiché, board courant).
3. Pages dans `pages/budget/`, exportées par `pages/index.ts`.
4. Routes sous `ProtectedRoute` > `AppLayout`, et remplacer la redirection `/` → `/profile` par l'accueil Insights.
5. Entrées dans `PRIMARY_MODULES` (`layouts/AppLayout.tsx`).

## Points relevés

Aucun de ces points n'a été corrigé.

- **Session expirée en cours d'utilisation** : rien n'intercepte les réponses 401. Si le jeton expire pendant qu'on navigue, les appels échouent avec un message d'erreur, mais l'utilisateur n'est pas renvoyé vers `/login` avant le prochain rechargement de la page.
- **URL de l'API par défaut** : sans `VITE_API_URL`, `fetchAPI` vise `http://localhost:5000`, alors que l'API tourne sur le port 8000 (la valeur de `.env` est correcte).
- **Type `JwtPayload`** : il décrit `userId` et `role` (`'Admin' | 'User'`), alors que Lexik émet `username`, `roles`, `iat` et `exp`. Seul `exp` est lu, donc sans conséquence aujourd'hui.
- **Version de TypeScript** : `SKILL.md` annonce TypeScript 7, le projet installe la 6.0.3 (`"typescript": "^6.0.0"`).
- **Styles en dur** : couleurs fixes dans `DeleteAccountCard` (`#fef2f2`, `#dc2626`) et dans l'avatar du profil, styles en ligne dans `AppLayout`. Les conventions demandent les tokens du thème.
