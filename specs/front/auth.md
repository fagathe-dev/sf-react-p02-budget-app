# Module Auth et profil — Front

Compte rendu des écrans d'authentification et de gestion du compte de `budget_front`. État au 28 octobre 2026.

Côté API : [specs/api/auth.md](../api/auth.md). Architecture commune (routage, session, `fetchAPI`, erreurs) : [socle.md](socle.md).

## En bref

- Connexion **par mot de passe** ou **par code reçu par e-mail**, au choix sur la même page.
- Inscription, puis activation par le lien reçu, qui **connecte directement** l'utilisateur.
- Mot de passe oublié, réinitialisation, confirmation d'un changement d'e-mail : chaque lien reçu par e-mail ouvre une page dédiée, accessible connecté ou non.
- Profil en trois onglets : informations, sécurité (e-mail et mot de passe), suppression du compte.
- Les mots de passe partent encodés en base64 (`encodeSecret`) ; les erreurs de l'API s'affichent en français, champ par champ quand l'API les rattache à un champ.

## Écrans

| Route | Page | Ce qu'elle fait |
| --- | --- | --- |
| `/login` | `LoginPage` | Sélecteur « Mot de passe » / « Code par e-mail », puis le formulaire correspondant. Lien vers l'inscription. |
| `/register` | `RegisterPage` | Création du compte, puis écran « vérifiez votre boîte » |
| `/forgot-password` | `ForgotPasswordPage` | Demande du lien de réinitialisation |
| `/verify-email?token=` | `VerifyEmailPage` | Activation du compte et connexion automatique |
| `/reset-password?token=` | `ResetPasswordPage` | Choix du nouveau mot de passe |
| `/confirm-email-change?token=` | `ConfirmEmailChangePage` | Validation de la nouvelle adresse |
| `/profile` | `ProfilePage` | Profil et compte |
| `/logout` | `LogoutPage` | Efface la session et renvoie vers `/login` |

`/login`, `/register` et `/forgot-password` renvoient vers `/` si une session existe déjà.

## Connexion

Après une connexion réussie, `setAuth(token, user)` enregistre la session et l'utilisateur arrive sur `/`.

**Par mot de passe** (`PasswordLoginForm`) :

- Champs : identifiant (e-mail ou nom d'utilisateur d'au moins 3 caractères) et mot de passe. Lien « Mot de passe oublié ».
- Si l'API répond `email_not_verified`, le formulaire affiche le message et un bouton « Renvoyer l'e-mail de vérification ».

**Par code** (`CodeLoginForm`), en deux étapes :

1. L'identifiant, puis « Recevoir un code de connexion ».
2. Le code à 6 chiffres. Le formulaire rappelle pour quel identifiant le code a été envoyé et affiche deux comptes à rebours, calculés à partir de `expiresIn` (validité du code) et `resendAvailable` (délai avant un nouvel envoi). Actions : « Se connecter », renvoyer le code une fois le délai écoulé, « Changer d'identifiant ».

## Inscription

Champs et règles (schéma zod de `RegisterPage`) :

| Champ | Règle |
| --- | --- |
| E-mail | Obligatoire, format valide |
| Nom d'utilisateur | 3 à 90 caractères |
| Mot de passe | 8 caractères minimum, avec une majuscule, une minuscule et un chiffre (`passwordSchema`) |
| Confirmation | Identique au mot de passe |

Les violations de l'API sur `email`, `username` et `password` (adresse ou nom déjà pris…) s'affichent sous le champ concerné ; les autres erreurs apparaissent dans une alerte.

Après l'inscription, la page affiche le message de l'API, rappelle de vérifier les courriers indésirables et propose « Renvoyer l'e-mail de vérification » et « Retour à la connexion ».

## Pages ouvertes depuis un e-mail

Les trois pages lisent le paramètre `token` de l'URL. Sans jeton, elles affichent directement « lien incomplet ».

| Page | Comportement |
| --- | --- |
| `VerifyEmailPage` | Appelle `POST /auth/verify-email` une seule fois (garde `useRef`, utile en `StrictMode`), enregistre la session renvoyée et redirige vers `/`. En cas d'échec : le message et « Se connecter pour recevoir un nouveau lien ». |
| `ResetPasswordPage` | Nouveau mot de passe et confirmation, avec le même `passwordSchema`. En cas de succès : le message et « Se connecter » ; sinon « Faire une nouvelle demande ». |
| `ConfirmEmailChangePage` | Appelle `POST /auth/confirm-email-change` une seule fois et affiche le chargement, le succès ou l'erreur. Si l'utilisateur connecté est celui du lien, son adresse est mise à jour dans le store. |

`ForgotPasswordPage` demande l'e-mail, affiche le message de l'API (toujours le même, que le compte existe ou non) et précise que le lien est valable 24 heures et ne sert qu'une fois.

## Profil

`ProfilePage` affiche :

- un bandeau : l'avatar (cliquable pour le changer), le nom complet ou à défaut le nom d'utilisateur, le badge du rôle, puis `@nom • e-mail` ;
- trois onglets.

| Onglet | Composants | Comportement |
| --- | --- | --- |
| Informations | `ChangeInformationsForm` | Nom d'utilisateur (obligatoire), prénom, nom. Un champ vidé est envoyé à `null`. Le store est mis à jour avec l'utilisateur renvoyé. |
| Sécurité & Connexion | `ChangeEmailForm` | Nouvelle adresse. Rien n'est envoyé si elle est vide ou identique à l'actuelle. Le message de l'API rappelle que l'adresse actuelle reste active jusqu'au clic sur le lien. |
| | `ChangePasswordForm` | Mot de passe actuel, nouveau et confirmation. Le front vérifie que les deux nouveaux sont identiques ; les autres règles sont contrôlées par l'API. |
| Danger Zone | `DeleteAccountCard` | Suppression en deux étapes, voir plus bas. |

**Avatar** (`ChangeAvatarForm`) : un clic sur l'avatar ouvre le sélecteur de fichier, l'envoi part tout de suite (`multipart/form-data`), puis le store reçoit l'utilisateur à jour. Sans avatar, les deux premières lettres du nom d'utilisateur s'affichent.

**Suppression du compte** (`DeleteAccountCard`) :

1. « Supprimer mon compte » ouvre une confirmation du navigateur, puis demande le code par e-mail.
2. Le formulaire du code affiche le message de l'API, la validité restante du code et le délai avant un nouvel envoi. Actions : « Confirmer la suppression définitive », renvoyer le code, « Annuler ».
3. Après la suppression, la session est effacée et l'utilisateur revient sur `/login`.

## Schémas partagés

`src/pages/auth/authSchemas.ts`, couvert par `authSchemas.test.ts` :

| Schéma | Règle |
| --- | --- |
| `passwordSchema` | 8 caractères minimum, une majuscule, une minuscule, un chiffre |
| `identifierSchema` | E-mail valide, ou nom d'utilisateur d'au moins 3 caractères |
| `loginCodeSchema` | Exactement 6 chiffres |

## Où trouver le code

| Fichier | Rôle |
| --- | --- |
| `src/pages/auth/*Page.tsx` | Les huit pages |
| `src/pages/auth/components/` | Formulaires de connexion, formulaires du profil, carte de suppression |
| `src/pages/auth/authSchemas.ts` | Schémas zod partagés |
| `src/services/auth.api.ts` | Appels `/auth/*` et `/account/*` |
| `src/types/auth.types.ts` | `User`, charges utiles et réponses |
| `src/stores/auth.store.ts`, `src/hooks/useAuth.ts` | Session |

## Points relevés

Aucun de ces points n'a été corrigé.

- **Formulaires du profil hors convention** : `ChangeInformationsForm`, `ChangeEmailForm` et `ChangePasswordForm` gèrent leurs champs avec `useState`, sans react-hook-form ni zod. Conséquences :
  - pas de validation côté client du nouveau mot de passe (règle de complexité) ;
  - les violations de l'API, comme « nom d'utilisateur déjà utilisé », s'affichent dans une alerte générale, pas sous le champ.
- **Confirmation native** : la suppression du compte passe par `window.confirm`, alors que le design system propose un `Modal`.
- **Couleurs en dur** dans `DeleteAccountCard` et dans le survol de l'avatar (voir [socle.md](socle.md#points-relevés)).
- **Inscription** : le front exige bien 8 caractères, mais l'API ne contrôle pas la longueur (voir [specs/api/auth.md](../api/auth.md#points-relevés-dans-le-socle)).

## Vérifications

`npm test` (dont `authSchemas.test.ts`) et `tsc -b --noEmit` passent. Les parcours n'ont pas été rejoués dans un navigateur dans cette session.
