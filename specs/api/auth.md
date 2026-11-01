# Module Auth et compte — API

Compte rendu de la partie authentification et compte utilisateur de `budget_api` : inscription, vérification de l'adresse, connexion par mot de passe ou par code, mot de passe oublié, profil, changement d'e-mail et de mot de passe, avatar, suppression du compte. État au 28 octobre 2026.

Cette partie vient du socle `sf-react-p01-base-app`. Pendant le développement du budget, elle n'a été modifiée qu'à deux endroits (voir [Branchements avec le budget](#branchements-avec-le-budget)).

Conventions générales (préfixe, format des erreurs) : voir [budget.md](budget.md#conventions-communes). Administration et health-check : voir [admin.md](admin.md).

## En bref

- Un compte se connecte avec son **nom d'utilisateur ou son e-mail**.
- Les mots de passe voyagent **encodés en base64** et l'API les décode (`SecretDecoder`) avant toute validation. L'encodage évite seulement de les voir en clair dans les journaux de requêtes ; ce n'est pas un chiffrement.
- La connexion renvoie un **JWT RS256** (Lexik) valable `JWT_TOKEN_TTL` secondes. Il n'y a pas de jeton de rafraîchissement ni de révocation : se déconnecter revient à oublier le jeton côté front.
- Un compte reste **inactif tant que son adresse n'est pas vérifiée**. Le lien de vérification active le compte et connecte directement l'utilisateur.
- **Connexion sans mot de passe** : un code à 6 chiffres reçu par e-mail.
- Les routes qui reçoivent un identifiant répondent toujours la même chose, que le compte existe ou non (**anti-énumération**).
- Liens et codes à usage unique sont stockés dans `user_request`, avec un type et une date d'expiration.

## Modèle de données

| Table | Rôle |
| --- | --- |
| `user` | Compte : `email` et `username` uniques, mot de passe haché (`auto`), rôles, prénom, nom, avatar (URL), `is_verified`, `email_verified_at`, `settings` (JSON, ajouté pour les insights) |
| `user_request` | Demande à usage unique : `type`, `code` (6 chiffres) ou `token` (64 caractères hexadécimaux), `payload` JSON, `is_used`, `expires_at`. Supprimée en cascade avec le compte. |

Types de `user_request` (`UserRequestTypeEnum`) : `email_verification`, `password_reset`, `email_change`, `otp_login`, `account_deletion`, `otp_register` (déclaré, non utilisé).

Créer une demande invalide les demandes actives du même type pour ce compte : seul le dernier lien ou code envoyé fonctionne.

Rôles : `ROLE_USER` (« Utilisateur ») et `ROLE_ADMIN` (« Administrateur »), qui hérite de `ROLE_USER`.

### Délais et limites

| Demande | Validité | Essais erronés | Délai entre deux envois |
| --- | --- | --- | --- |
| Lien de vérification de l'adresse | 72 h | — | — |
| Lien de réinitialisation du mot de passe | 24 h | — | — |
| Lien de confirmation d'un changement d'e-mail | 24 h | — | — |
| Code de connexion | 90 s | 5, puis le code est révoqué | 30 s |
| Code de suppression du compte | 10 min | 5, puis le code est révoqué | 30 s |
| Lien « choisir mon mot de passe » d'un administrateur créé en ligne de commande | 72 h | — | — |

Les compteurs d'essais et d'envois sont gardés dans le cache applicatif (`cache.app`).

## Utilisateur renvoyé

Groupe de sérialisation `user.read`, renvoyé par la connexion, le profil et ses modifications :

```json
{
  "id": "01a17f6c-25d0-7dd9-9776-f12b6a4ea942",
  "email": "test@example.com",
  "role": "ROLE_USER",
  "username": "test",
  "firstname": null,
  "lastname": null,
  "avatar": "http://localhost:8000/uploads/avatars/<id>/<fichier>.webp",
  "settings": null,
  "isVerified": true,
  "createdAt": "2026-10-27T23:12:44+01:00",
  "updatedAt": null
}
```

## Endpoints d'authentification (publics)

Toutes ces routes sont sous `^/api/auth/`, en `PUBLIC_ACCESS`.

| Méthode et route | Corps | Réponse |
| --- | --- | --- |
| `POST /api/auth/register` | `{ email, username, password }` | 201 `{ user, message }` ; envoie le lien de vérification |
| `POST /api/auth/verify-email` | `{ token }` | 200 `{ token, user, message }` : compte activé et connecté |
| `POST /api/auth/resend-verification` | `{ username }` (nom d'utilisateur ou e-mail) | 200 `{ message }`, toujours identique |
| `POST /api/auth/login` | `{ username, password }` | 200 `{ token, user }` |
| `POST /api/auth/login-code` | `{ username }` | 200 `{ message, expiresIn, resendAvailable }`, toujours identique |
| `POST /api/auth/login-code/verify` | `{ username, code }` | 200 `{ token, user }` |
| `POST /api/auth/forgot-password` | `{ email }` | 200 `{ message }`, toujours identique |
| `POST /api/auth/reset-password` | `{ token, password }` | 200 `{ message }` |
| `POST /api/auth/confirm-email-change` | `{ token }` | 200 `{ user, message }` |

`password` est toujours encodé en base64.

### Inscription

```jsonc
// POST /api/auth/register
{ "email": "camille@example.com", "username": "camille", "password": "UGFzc3dvcmQxMjMh" } // "Password123!"
```

- Règles : e-mail valide et unique ; nom d'utilisateur de 3 à 90 caractères, unique ; mot de passe avec une majuscule, une minuscule et un chiffre.
- Le compte est créé avec `ROLE_USER`, non vérifié, puis l'e-mail de vérification part.
- Si l'e-mail ne peut pas partir, l'inscription est **annulée** (le compte est supprimé, l'e-mail et le nom d'utilisateur redeviennent libres) : 422 si le domaine ne reçoit pas d'e-mails, 502 en cas de panne d'envoi.

### Vérification de l'adresse

Le lien de l'e-mail mène à `{FRONTEND_URL}/verify-email?token=…`, qui appelle `POST /api/auth/verify-email`.

- La première vérification marque le compte vérifié, envoie l'e-mail de bienvenue et publie `UserActivatedEvent`, qui crée le board perso « Mon budget ».
- La réponse contient un JWT : l'utilisateur est connecté sans ressaisir son mot de passe.
- 400 si le lien est invalide, expiré ou déjà utilisé ; 422 si le jeton manque.

### Connexion par mot de passe

| Cas | Réponse |
| --- | --- |
| Identifiants corrects, compte vérifié | 200 `{ token, user }` |
| Identifiant inconnu ou mot de passe faux | 401 `{ "message": "Identifiants invalides." }`. Un hachage factice lisse le temps de réponse quand le compte n'existe pas. |
| Compte non vérifié | 403 `{ "code": "email_not_verified", "message": "Veuillez vérifier votre adresse e-mail avant de vous connecter." }` |
| Mot de passe pas en base64 | 400 `{ "message": "Format de données invalide." }` |
| Champ vide | 422 |

Le code `email_not_verified` permet au front de proposer « Renvoyer l'e-mail de vérification ».

### Connexion par code

1. `POST /api/auth/login-code` avec l'identifiant. Si le compte existe et est vérifié, un code à 6 chiffres part par e-mail. La réponse est la même dans tous les cas :

   ```json
   { "message": "Si ce compte existe, un code de connexion vous a été envoyé par e-mail.", "expiresIn": 90, "resendAvailable": 30 }
   ```

   Une nouvelle demande dans les 30 secondes n'envoie rien (même réponse).
2. `POST /api/auth/login-code/verify` avec l'identifiant et le code. Le code est cherché parmi les demandes de **ce** compte uniquement, car un code à 6 chiffres n'est pas unique entre utilisateurs.

Refus : 401 « Code invalide ou expiré. » ; 429 « Trop de tentatives. Demandez un nouveau code de connexion. » au cinquième essai erroné, et le code est alors révoqué.

### Mot de passe oublié

1. `POST /api/auth/forgot-password` avec l'e-mail. Si un compte existe, il reçoit un lien `{FRONTEND_URL}/reset-password?token=…` valable 24 h. La réponse ne dit pas si le compte existe.
2. `POST /api/auth/reset-password` avec le jeton et le nouveau mot de passe (base64, mêmes règles qu'à l'inscription, 8 caractères minimum).

Le lien prouve la possession de l'adresse : un compte pas encore vérifié est activé au passage (et reçoit son board perso). Le même écran sert aux administrateurs créés en ligne de commande pour choisir leur mot de passe.

## Endpoints du compte (connecté)

| Méthode et route | Corps | Réponse |
| --- | --- | --- |
| `GET /api/account/profile` | — | 200 utilisateur |
| `PUT` ou `PATCH /api/account/profile` | `{ username, firstname?, lastname? }` | 200 utilisateur |
| `PUT` ou `PATCH /api/account/email` | `{ email }` | 200 `{ message }` ; envoie le lien de confirmation sur la nouvelle adresse |
| `PUT` ou `PATCH /api/account/password` | `{ currentPassword, newPassword }` (base64) | 200 `{ message }` |
| `POST /api/account/avatar` | `multipart/form-data`, champ `avatar` (ou `file`) | 200 utilisateur |
| `POST /api/account/delete-request` | — | 200 `{ message, expiresIn, resendAvailable }` ; envoie le code de suppression |
| `DELETE /api/account` | `{ code }` | 204 : compte supprimé |

### Profil

- Nom d'utilisateur de 3 à 90 caractères, unique ; prénom et nom de 80 caractères au plus.
- Un prénom ou un nom vide est enregistré à `null`.

### Changement d'e-mail

1. `PUT /api/account/email` **ne modifie pas** l'adresse : il garde la nouvelle dans le `payload` d'une demande `email_change` et envoie un lien `{FRONTEND_URL}/confirm-email-change?token=…` à la **nouvelle** adresse. L'ancienne reste active entre-temps.
2. `POST /api/auth/confirm-email-change` (public, le jeton fait foi) enregistre la nouvelle adresse.

Refus en 400 si l'adresse est l'adresse actuelle ou est déjà prise. À la confirmation, 409 si un autre compte a pris l'adresse entre-temps.

### Mot de passe

Le mot de passe actuel est vérifié (422 « Le mot de passe actuel est incorrect. » sinon). Le nouveau suit les mêmes règles qu'à la réinitialisation.

### Avatar

- JPG, PNG, WEBP ou GIF, 5 Mo au plus.
- Le fichier est rangé dans `public/uploads/avatars/<id utilisateur>/` par `UploaderService` (`core-php`), et l'ancien fichier est remplacé.
- L'utilisateur renvoyé porte l'URL complète, construite à partir de `DEFAULT_URI`.

### Suppression du compte

1. `POST /api/account/delete-request` envoie un code à 6 chiffres valable 10 minutes. Une nouvelle demande dans les 30 secondes renvoie 429.
2. `DELETE /api/account` avec `{ "code": "123456" }`.

Refus : 400 si le code n'a pas 6 chiffres ; 422 s'il est faux ou expiré ; 429 au cinquième essai erroné (le code est révoqué).

À la suppression :

- l'avatar est effacé du disque ;
- `AccountBoardsCleaner` protège les boards des autres : un board partagé dont le compte est propriétaire passe au premier autre membre lié, et ses adhésions deviennent des invités locaux (voir [budget.md](budget.md#branchements-dans-le-socle)) ;
- le compte est supprimé, avec en cascade ses demandes, son board perso et ses tags.

## E-mails

Chaîne du socle : `Dto/Mail/<Nom>MailDto` → `EmailDispatcherService::HANDLER_MAP` → `Mailer/<Nom>MailHandler` → template Twig. Chaque e-mail a un aperçu admin sous son slug (voir [admin.md](admin.md#prévisualisation-des-e-mails)).

| Slug | Envoyé quand | Template |
| --- | --- | --- |
| `account-verification` | Inscription, renvoi du lien | `emails/auth/account_verification.html.twig` |
| `registration-confirmed` | Première vérification de l'adresse | `emails/auth/registration_confirmed.html.twig` |
| `otp-verification` | Demande de code de connexion | `emails/auth/otp_verification.html.twig` |
| `forgot-password` | Mot de passe oublié | `emails/auth/forgot_password.html.twig` |
| `email-change-verification` | Changement d'e-mail (envoyé à la nouvelle adresse) | `emails/auth/email_change_verification.html.twig` |
| `account-deletion-code` | Demande de suppression du compte | `emails/auth/account_deletion_code.html.twig` |
| `admin-account-created` | `core-php:create-admin-user` | `emails/admin/account_created.html.twig` |

Les envois « silencieux » (bienvenue, code de connexion, mot de passe oublié) n'interrompent jamais la requête en cas d'échec : l'erreur est journalisée par `AbstractMailerHandler` et la réponse reste la même.

Les liens pointent vers `FRONTEND_URL`, ou vers l'origine de la requête si la variable est absente.

## Créer un administrateur

```bash
php bin/console core-php:create-admin-user
```

La commande (implémentée par `AdminUserManager`) crée un compte vérifié avec le rôle choisi. Elle envoie un récapitulatif et un lien de 72 h vers `/reset-password` pour que l'administrateur choisisse son propre mot de passe. Si l'e-mail ne part pas, le compte existe quand même : « Mot de passe oublié » prend le relais.

## Branchements avec le budget

Les deux seules modifications apportées à cette partie pendant le développement du budget :

| Fichier | Modification |
| --- | --- |
| `src/Service/AuthService.php` | Publie `UserActivatedEvent` à la première vérification de l'adresse et à la réinitialisation du mot de passe d'un compte non vérifié. |
| `src/Service/AccountService.php` | Appelle `AccountBoardsCleaner::beforeAccountDeletion()` avant la suppression du compte. |

## Où trouver le code

| Fichier | Rôle |
| --- | --- |
| `src/Controller/Auth/AuthController.php` | Routes `api_auth_*` (publiques) |
| `src/Controller/Auth/AccountController.php` | Routes `api_account_*` (`IS_AUTHENTICATED_FULLY`) |
| `src/Service/AuthService.php` | Inscription, vérification, connexion, code, mot de passe oublié |
| `src/Service/AccountService.php` | Profil, e-mail, mot de passe, avatar, suppression |
| `src/Service/UserRequestService.php` | Création, recherche, consommation et révocation des demandes |
| `src/Service/SecretDecoder.php` | Décodage base64 des secrets |
| `src/Service/AdminUserManager.php` | Création d'administrateurs pour la commande `core-php` |
| `src/Dto/Auth/`, `src/Dto/Account/`, `src/Dto/Mail/` | DTO d'entrée et d'e-mail |
| `src/Entity/User.php`, `src/Entity/UserRequest.php` | Entités |
| `src/Enum/Auth/` | `RoleEnum`, `UserRequestTypeEnum` |
| `src/Security/Voter/OwnerVoter.php` | `IS_OWNER`, `VIEW`, `EDIT`, `DELETE` pour les entités qui appartiennent à un utilisateur (tags perso) |

## Points relevés dans le socle

Constatés en rédigeant cette fiche ; je n'ai rien corrigé.

- **Longueur du mot de passe non contrôlée à l'inscription.** Le motif de `User::$password` est `#^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]){8,}#` : le `{8,}` répète les vérifications au lieu de compter des caractères, donc `aA1` (3 caractères) est accepté. Les DTO de réinitialisation et de changement utilisent le bon motif, `.{8,}$`. Le front bloque déjà les mots de passe courts, mais pas un appel direct à l'API. Le message contient aussi une faute (« masjuscule »).
- **Liens et codes stockés en clair** dans `user_request` (`token`, `code`). Une fuite de la base donnerait des liens de réinitialisation utilisables pendant 24 h. Les invitations du budget, elles, ne stockent que le hash SHA-256 de leur jeton.
- **Codes d'erreur hétérogènes** : un champ manquant renvoie 422 sur la plupart des routes d'authentification, mais 400 (violations) sur l'inscription et le profil.
- **JWT non révocable** : un jeton reste valable jusqu'à son expiration, même après une déconnexion, un changement de mot de passe ou une suppression du compte (dans ce dernier cas, l'utilisateur n'existe plus et la requête échoue).

## Vérifications

Cette partie n'a pas été rejouée par requête HTTP dans cette session. Le défaut de longueur du mot de passe a été vérifié directement avec `preg_match` sur les deux motifs. `lint:container` et `doctrine:schema:validate` passent avec les deux branchements décrits plus haut.
