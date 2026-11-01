---
name: sf-react-p02-budget-app
description: Conventions et workflow du projet Budget App (API Symfony `budget_api` + front React `budget_front`). À charger avant toute création ou modification de code dans ce dépôt : nouveau module métier, endpoint, entité, e-mail, page, composant, service ou store.
---

# Budget App

Monorepo à deux projets, bâti sur le socle `sf-react-p01-base-app` (auth, compte, logs, prévisualisation des e-mails).

| Dossier         | Stack                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `budget_api/`   | Symfony 8.1, PHP 8.4, Doctrine ORM 3 (MySQL, UUID v7), Lexik JWT RS256, `fagathe-dev/core-php`                                          |
| `budget_front/` | React 19, Vite 8, TypeScript 7, React Compiler, zustand, react-router 7, styled-components 6, react-hook-form + zod 4, axios, `core-ts` |

## Règles impératives

- **Ne jamais lire, modifier ni créer `.env.local`** (API comme front) : il contient les secrets, la personne s'en occupe. Pareil pour `budget_api/config/jwt/` : ne jamais générer de clés ni de secrets à sa place.
- Schéma de base : toujours `php bin/console make:migration` puis `doctrine:migrations:migrate` (migrations dans `src/Migrations`). Jamais `doctrine:schema:update` ni de SQL à la main.
- Nouveau paquet Symfony : `composer require` (recette Flex). Ne pas câbler `config/bundles.php` à la main.
- npm : installer avec `--legacy-peer-deps` (typescript-eslint ne supporte pas encore TS 7). Les dépendances git sont autorisées par `budget_front/.npmrc`.
- Ne rien commiter sans demande explicite.
- Lire `budget_api/AGENTS.md` pour les conventions Symfony générales. En cas de conflit, **le code existant du socle fait foi**.

## Principes SOLID — Instructions de génération de code

Lors de la génération ou de la modification de code, applique systématiquement les **principes SOLID** afin de produire un code maintenable, évolutif, testable et faiblement couplé.

- **S — Single Responsibility Principle (responsabilité unique)** : chaque classe, fonction ou module doit avoir une responsabilité clairement définie et une seule raison de changer.
- **O — Open/Closed Principle (ouvert/fermé)** : le code doit pouvoir être étendu sans nécessiter de modifier inutilement le code existant.
- **L — Liskov Substitution Principle (substitution de Liskov)** : les implémentations doivent pouvoir remplacer leurs abstractions sans modifier le comportement attendu.
- **I — Interface Segregation Principle (ségrégation des interfaces)** : privilégie des interfaces spécifiques et cohérentes plutôt que des interfaces trop larges imposant des dépendances inutiles.
- **D — Dependency Inversion Principle (inversion des dépendances)** : les modules de haut niveau doivent dépendre d'abstractions plutôt que d'implémentations concrètes. Privilégie l'injection de dépendances lorsque cela est pertinent.

### Règles d'application

1. Sépare les responsabilités métier, la logique applicative, l'accès aux données et les détails techniques lorsque cela est pertinent pour l'architecture.
2. Évite les classes ou services trop volumineux, les responsabilités multiples, les dépendances circulaires et la duplication de logique métier.
3. Utilise des interfaces et des abstractions uniquement lorsqu'elles apportent une réelle valeur, notamment pour découpler les composants et faciliter les tests.
4. Privilégie la composition à l'héritage lorsque cela permet de réduire le couplage.
5. Respecte les conventions et l'architecture déjà présentes dans le projet.
6. Ne sur-ingénierie pas le code : n'ajoute pas de classes, interfaces, abstractions ou couches inutiles pour appliquer SOLID artificiellement.
7. Avant de terminer, vérifie que le code généré respecte ces principes et explique brièvement tout compromis architectural important.

**Objectif :** produire un code simple, lisible, testable et évolutif, en appliquant SOLID de manière pragmatique plutôt que dogmatique.

## API (`budget_api`)

### Architecture : Controller → Service → Repository

- **Contrôleur** : `final`, étend `AbstractController`, routes en attributs, aucune logique. Chaque action délègue au service puis renvoie :
  ```php
  $res = $this->service->doSomething($request);
  return $this->json($res->data, $res->status, $res->headers, $res->context);
  ```
- **Service** : `final`, `use ResponseTrait, LoggerTrait` (+ `RequestTrait`, `DatetimeTrait`, `FileTrait` selon besoin) de `Fagathe\CorePhp\…`. Chaque méthode publique renvoie `$this->sendJson($data, $status, context: ['groups' => [...]])` ou `$this->sendViolations([...])`. Les erreurs sont attrapées, journalisées via `LoggerTrait`, et renvoyées en 500 avec un message en français.
- **DTO** : `src/Dto/<Module>/<Action>Dto.php`, `final class` à propriétés publiques typées avec valeur par défaut et contraintes `#[Assert\…]` (messages en français). Le service désérialise et valide le DTO comme dans `AccountService`.
- **Repository** : requêtes Doctrine uniquement, pas de logique métier.
- Préfixe global `/api` (`config/routes.yaml`). Nommage des routes : `api_<module>_<action>`.

### Données et sécurité

- Entités : identifiant `Uuid::v7()` en `BINARY(16)`. Les groupes de sérialisation sont nommés `<entité>.read`, `<entité>.list`, etc.
- Une entité métier appartient à un `User` : relation `ManyToOne` + getter propriétaire, puis contrôle d'accès via `OwnerVoter` (`IS_OWNER`, `VIEW`, `EDIT`, `DELETE`) avec `#[IsGranted]` ou `denyAccessUnlessGranted`.
- Penser à la suppression de compte : `AccountService::performAccountDeletion` doit purger les nouvelles données de l'utilisateur (cascade Doctrine ou suppression explicite).
- Les mots de passe et codes arrivent encodés en base64 : les décoder avec `SecretDecoder`.
- `ROLE_ADMIN` pour tout ce qui est sous `/api/admin`.

### E-mails

Chaîne : `Dto/Mail/<Nom>MailDto` → entrée dans `EmailDispatcherService::HANDLER_MAP` → `Mailer/<Nom>MailHandler` (étend `AbstractMailerHandler`) → `templates/emails/<domaine>/<nom>.html.twig`.
Envoyer avec `$this->emailDispatcher->dispatch(new XxxMailDto(...))`. Ajouter un jeu de données fictives dans `EmailMockService` pour que le nouvel e-mail apparaisse dans la prévisualisation admin.

### Commandes utiles

```bash
php bin/console lint:container
php bin/console doctrine:schema:validate --skip-sync
php bin/console lint:twig templates/
php bin/console debug:router
php bin/console doctrine:fixtures:load        # test@example.com / admin@example.com — Password123!
php bin/console core-php:create-admin-user
php bin/console core-php:log-file-rotation
```

## Front (`budget_front`)

### Arborescence

| Dossier               | Rôle                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/`             | Design system. **Toujours réutiliser** ses composants (`Base`, `Forms`, `Feedback`, `Grid`, `Navigation`, `Typo`…) avant d'en créer. Doc : `src/ui/docs/` |
| `src/services/`       | Appels HTTP : un fichier `<module>.api.ts` par domaine                                                                                                    |
| `src/types/`          | Types partagés : `<module>.types.ts`                                                                                                                      |
| `src/stores/`         | Stores zustand (`<module>.store.ts`)                                                                                                                      |
| `src/hooks/`          | Hooks transverses, exportés par `hooks/index.ts`                                                                                                          |
| `src/pages/<module>/` | Pages, `components/`, schémas zod (`<module>Schemas.ts`), barrel `index.ts`                                                                               |
| `src/layouts/`        | `AppLayout` (sidebar connectée) et `AuthLayout`                                                                                                           |
| `src/router/`         | `createBrowserRouter`, gardes `ProtectedRoute`, `PublicRoute`, `AdminRoute`                                                                               |
| `src/utils/`          | Fonctions pures (jwt, rôles, secrets, chaînes) + tests                                                                                                    |

### Conventions

- Imports avec l'alias `@/…`. Chaque dossier expose un barrel `index.ts`.
- Appels API : toujours via `fetchAPI<T>(endpoint, { method, body })`. Si `!res.ok`, lever `toApiError(res, 'Message par défaut')`. Encoder les secrets avec `encodeSecret` avant envoi.
- Formulaires : `react-hook-form` + `zodResolver`. Les violations renvoyées par l'API sont reportées sur les champs via `getFieldErrors(err)` + `setError` (voir `RegisterPage`).
- Auth : `useAuth()` / `useAuthStore`. Le jeton est stocké sous la clé `budget_auth_token`.
- Styles : styled-components et tokens du thème (`src/ui/theme`), jamais de couleurs en dur.
- Textes d'interface en français.

### Ajouter un module métier côté front

1. Types (`types/<module>.types.ts`) et service (`services/<module>.api.ts`).
2. Store zustand si l'état est partagé entre plusieurs pages.
3. Pages dans `pages/<module>/`, exportées par `pages/index.ts`.
4. Routes dans `router/index.tsx`, sous `ProtectedRoute` > `AppLayout`. Remplacer la redirection `/` → `/profile` par l'accueil budget.
5. Entrée de menu dans `PRIMARY_MODULES` (`layouts/AppLayout.tsx`).

### Commandes utiles

```bash
npm run dev
npm test          # vitest run
npm run build     # tsc -b && vite build
```

`npm run lint` est cassé tant que typescript-eslint ne supporte pas TS 7.

## Définition de « terminé »

- API : `lint:container` et `doctrine:schema:validate --skip-sync` passent, la migration est générée, et l'endpoint est testé par une requête HTTP réelle ou un test fonctionnel.
- Front : `npm run build` et `npm test` passent. Les nouvelles fonctions utilitaires et les schémas zod ont leurs tests.
- Signaler tout bug du socle rencontré au lieu de le corriger en douce.

## Déploiement

`./deploy-budget.sh [--project=api|frontend] [--migrations]` depuis le serveur. Le script clone le dépôt, conserve `.env.local`, les clés JWT et `public/uploads`, compile le front puis bascule les dossiers.
