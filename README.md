# Budget App

Application de budget mensuel prévisionnel. Un board partagé calcule la part de chacun dans les charges du foyer, puis cette part remonte automatiquement dans le board perso de chaque membre pour donner son vrai reste à vivre. Un module ExpenseSplitter partage en plus les dépenses réelles d'un groupe (vacances, sorties) et calcule qui doit combien à qui.

## Contexte

Dans un couple ou une colocation, une partie des charges est commune (loyer, courses, internet) et une partie est personnelle (transport, téléphone, épargne). Un tableur répond mal à trois questions :

- **Combien me reste-t-il vraiment chaque mois ?** Une fois ma part des charges communes déduite, et pas seulement mes dépenses perso.
- **Que se passe-t-il pour les factures irrégulières ?** L'électricité un mois sur deux, l'assurance annuelle, la taxe foncière en octobre, un cadeau ponctuel en décembre.
- **Qui doit combien à qui ?** Quand chacun paie certaines charges de son côté, ou pendant un week-end entre amis.

L'application ne suit pas les dépenses au jour le jour : elle modélise un **budget type mensuel**. Chaque poste suit une règle de récurrence, chaque mois peut faire exception, et tout est recalculé par le serveur pour le mois affiché.

## Objectifs

- Saisir chaque charge commune **une seule fois**, dans le board partagé. La part de chaque membre s'en déduit et remonte dans son board perso.
- Afficher, pour n'importe quel mois, le **reste à vivre**, le taux de charges, ce qui tombe ce mois-ci et ce qui mérite attention (page d'accueil Insights).
- Gérer les **récurrences** (mensuelle, tous les N mois, mois précis, ponctuelle), les **modes de prise en compte** (à l'échéance ou lissé) et les **exceptions** d'un mois (montant réel, ne pas compter).
- **Répartir** les charges à parts égales, en pourcentage ou en montant fixe, et dire qui doit rembourser qui, avec le moins de virements possible.
- Garder l'**historique** juste : modifier un montant crée une révision datée, les mois passés ne changent pas.
- Rester **extensible sans toucher au schéma** : une nouvelle récurrence, une nouvelle répartition ou une nouvelle règle d'insight s'ajoute par une classe.

Feuille de route :

| Version | Contenu |
| --- | --- |
| V1, Mon budget | Board perso, board partagé avec invités locaux, postes, fréquences, tags, remontée de la quote-part, reste à vivre, accueil Insights |
| V2, Foyer connecté | Invitation de comptes existants, part qui remonte chez chaque membre, répartition par poste, payeur et équilibre |
| V3, Confort | Historique et comparaison, graphiques par tag, export CSV ou PDF |

## État du projet

| Partie | État |
| --- | --- |
| API, socle (`budget_api`) | Authentification JWT, compte, logs, prévisualisation des e-mails. Comptes rendus : [auth](specs/api/auth.md), [admin](specs/api/admin.md) |
| API, modules métier | Budget, Insights et ExpenseSplitter développés et testés par requêtes HTTP. Comptes rendus : [budget](specs/api/budget.md), [insights](specs/api/insights.md), [expense-splitter](specs/api/expense-splitter.md) |
| Front (`budget_front`) | Socle seulement (connexion, inscription, profil, administration). Les écrans du budget restent à développer. Comptes rendus : [socle](specs/front/socle.md), [auth](specs/front/auth.md), [admin](specs/front/admin.md) |

## Stack

| Dossier | Technologies |
| --- | --- |
| `budget_api/` | Symfony 8.1, PHP 8.4, Doctrine ORM 3 (MySQL, UUID v7), Lexik JWT (RS256), [`fagathe-dev/core-php`](https://github.com/fagathe-dev/core-php) |
| `budget_front/` | React 19, Vite 8, TypeScript, React Compiler, zustand, react-router 7, styled-components 6, react-hook-form + zod 4, [`core-ts`](https://github.com/fagathe-dev/core-ts) |
| `specs/` | Comptes rendus techniques par module |

## Installation en local

### Prérequis

- **PHP 8.4** avec les extensions `pdo_mysql`, `openssl`, `mbstring`, `ctype` et `iconv`
- **Composer 2**
- **MySQL 8**
- **Node.js 22** ou plus récent (Vite 8 exige au moins 20.19), et npm
- **Git**, avec un accès à GitHub : `core-php` (Composer) et `core-ts` (npm) s'installent depuis leur dépôt
- Facultatif :
  - le [Symfony CLI](https://symfony.com/download) pour lancer l'API ;
  - [Mailpit](https://mailpit.axllent.org/) pour recevoir les e-mails en local.

### 1. Cloner le dépôt

```bash
git clone https://github.com/fagathe-dev/sf-react-p02-budget-app.git
cd sf-react-p02-budget-app
```

### 2. API

```bash
cd budget_api
composer install
```

Créez `budget_api/.env.local`. Ce fichier n'est pas versionné et contient vos réglages et secrets. Adaptez les valeurs :

```dotenv
# Base MySQL (le .env versionné pointe vers PostgreSQL par défaut)
DATABASE_URL="mysql://utilisateur:motdepasse@127.0.0.1:3306/budget_app?serverVersion=8.0.32&charset=utf8mb4"

# JWT : la passphrase doit être celle utilisée pour générer les clés (étape suivante)
JWT_PASSPHRASE=une-passphrase-a-vous
JWT_TOKEN_TTL=3600

# URLs utilisées dans les e-mails (liens de vérification, invitations)
DEFAULT_URI=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# E-mails : null://null n'envoie rien ; smtp://localhost:1025 pour Mailpit
MAILER_DSN=smtp://localhost:1025
DEFAULT_EMAIL_SENDER=no-reply@budget.local
APP_NAME="Budget App"
SUPPORT_EMAIL=support@budget.local
```

`JWT_TOKEN_TTL` n'a pas de valeur par défaut : sans lui, l'API ne démarre pas.

Générez les clés JWT. Elles sont écrites dans `config/jwt/` et ne sont pas versionnées :

```bash
php bin/console lexik:jwt:generate-keypair
```

Créez la base, appliquez les migrations, puis chargez les données de démonstration :

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load
```

Lancez l'API sur le port 8000 :

```bash
symfony serve -d --port=8000
# ou, sans Symfony CLI :
php -S localhost:8000 -t public public/index.php
```

Vérification : `http://localhost:8000/api/health-check` doit répondre.

### 3. Front

```bash
cd ../budget_front
npm install --legacy-peer-deps
```

`--legacy-peer-deps` est nécessaire : typescript-eslint ne déclare pas encore la version de TypeScript utilisée.

L'URL de l'API se lit dans `VITE_API_URL`. La valeur de `.env` (`http://localhost:8000/api`) convient si l'API tourne sur le port 8000. Sinon, surchargez-la dans `budget_front/.env.local`.

```bash
npm run dev
```

L'application s'ouvre sur `http://localhost:5173`. Le CORS de l'API accepte `localhost` et `127.0.0.1` sur tous les ports.

### 4. Se connecter

Les fixtures créent deux comptes, avec le mot de passe `Password123!` :

| Compte | Rôle | Données |
| --- | --- | --- |
| `test@example.com` | Utilisateur | Board perso « Mon budget », board partagé « Appartement » avec Camille, groupe « Vacances Biarritz » |
| `admin@example.com` | Administrateur | Board perso. Peut accepter l'invitation de démonstration (`/invitations/invitation-camille-appartement`). |

Pour créer un autre administrateur : `php bin/console core-php:create-admin-user`.

## Commandes utiles

API (depuis `budget_api/`) :

```bash
php bin/console lint:container
php bin/console doctrine:schema:validate
php bin/console lint:twig templates/
php bin/console debug:router
php bin/console make:migration                  # après une modification d'entité
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load           # recharge les données (vide la base)
```

Le schéma évolue toujours par `make:migration` puis `doctrine:migrations:migrate`, jamais par `doctrine:schema:update`.

Front (depuis `budget_front/`) :

```bash
npm run dev       # serveur de développement
npm test          # tests vitest
npm run build     # vérification TypeScript et build de production
```

`npm run lint` ne fonctionne pas encore : typescript-eslint ne prend pas en charge la version de TypeScript du projet.

## Dépannage

| Symptôme | Cause et solution |
| --- | --- |
| `Unable to create a signed JWT from the given configuration` ou `It was not possible to parse your key` à la connexion | Les clés de `config/jwt/` ont été générées avec une autre passphrase que `JWT_PASSPHRASE`. Régénérez-les : `php bin/console lexik:jwt:generate-keypair --overwrite`. Les jetons déjà émis deviennent invalides. |
| L'API ne démarre pas : `Environment variable not found: "JWT_TOKEN_TTL"` | Ajoutez `JWT_TOKEN_TTL` dans `budget_api/.env.local`. |
| `composer install` ou `npm install` échoue sur `core-php` ou `core-ts` | Ces paquets viennent de GitHub : vérifiez l'accès réseau et Git. |
| `npm install` échoue sur les dépendances paires | Relancez avec `--legacy-peer-deps`. |
| Les liens des e-mails pointent au mauvais endroit | Vérifiez `FRONTEND_URL` et `DEFAULT_URI`. |

## Documentation

API (`specs/api/`) :

- [auth.md](specs/api/auth.md) : inscription, vérification, connexion par mot de passe ou par code, mot de passe oublié, profil, suppression du compte.
- [admin.md](specs/api/admin.md) : aperçu des e-mails, explorateur de logs, health-check.
- [budget.md](specs/api/budget.md) : boards, membres, postes, exceptions, répartitions, invitations, tags, moteur de calcul. Contient aussi les conventions communes de l'API.
- [insights.md](specs/api/insights.md) : page d'accueil, KPI et règles d'insight.
- [expense-splitter.md](specs/api/expense-splitter.md) : groupes de dépenses, soldes et remboursements.

Front (`specs/front/`) :

- [socle.md](specs/front/socle.md) : routage, session, appels à l'API, mises en page, thème, design system, tests.
- [auth.md](specs/front/auth.md) : écrans de connexion, d'inscription, liens reçus par e-mail, profil.
- [admin.md](specs/front/admin.md) : aperçu des e-mails et explorateur de logs.

Conventions : [SKILL.md](SKILL.md) décrit le code et le workflow du dépôt (à lire avant de contribuer).
# sf-react-p02-budget-app
