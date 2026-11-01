# Module Admin — API

Compte rendu des routes d'administration et de supervision de `budget_api` : prévisualisation des e-mails, explorateur de logs, health-check. Elles viennent du socle ; le budget n'y a ajouté que l'aperçu de l'e-mail d'invitation. État au 28 octobre 2026.

Conventions générales : voir [budget.md](budget.md#conventions-communes).

## Droits

`security.yaml` réserve tout `^/api/admin` à `ROLE_ADMIN`, et chaque contrôleur porte aussi `#[IsGranted('ROLE_ADMIN')]`. Un utilisateur simple reçoit 403.

Seul `GET /api/health-check` est public.

## Endpoints

| Méthode et route | Réponse |
| --- | --- |
| `GET /api/admin/emails` | 200, liste des e-mails prévisualisables |
| `GET /api/admin/emails/{slug}` | 200, **HTML** de l'e-mail rendu avec des données factices ; 404 si le slug est inconnu |
| `GET /api/admin/logs` | 200, arborescence des fichiers de log par date |
| `GET /api/admin/logs/{jj-mm-aaaa}/{chemin}` | 200, entrées du fichier, les plus récentes en premier ; 404 `{ "message": "Fichier de log introuvable." }` |
| `GET /api/health-check` | 200 si tout va bien, 503 sinon |

## Prévisualisation des e-mails

`EmailMockService` construit chaque e-mail (template et contexte) avec des données factices, **sans l'envoyer**.

```json
[
  {
    "slug": "account-verification",
    "label": "Vérification du compte",
    "description": "Lien d'activation envoyé à l'inscription.",
    "subject": "…",
    "from": [{ "name": "Budget App", "email": "no-reply@…" }],
    "to": [{ "name": "…", "email": "…" }]
  }
]
```

Slugs disponibles :

| Slug | E-mail |
| --- | --- |
| `account-verification` | Vérification du compte |
| `otp-verification` | Code de connexion |
| `registration-confirmed` | Bienvenue |
| `forgot-password` | Mot de passe oublié |
| `email-change-verification` | Changement d'e-mail |
| `account-deletion-code` | Suppression de compte |
| `admin-account-created` | Compte administrateur créé |
| `board-invitation` | Invitation dans un board (ajouté par le module Budget) |

Ajouter un e-mail à l'aperçu : une entrée dans `EmailMockService::PREVIEWS` et un cas dans `createMock()`.

## Explorateur de logs

`LogService` lit les fichiers JSON écrits par le Logger de `core-php`, rangés dans `%core_php.logger.logs_dir%` sous la forme `<dossier>/<nom>-jj-mm-aaaa.json`.

Un fichier est désigné par sa date et son chemin « pointé » : `GET /api/admin/logs/27-10-2026/service.budget-service` lit `service/budget-service-27-10-2026.json`. Le chemin réel est contrôlé pour qu'aucune requête ne sorte du dossier de logs.

```jsonc
// GET /api/admin/logs : dates de la plus récente à la plus ancienne
[
  {
    "date": "27-10-2026",
    "count": 3,
    "items": [
      { "type": "folder", "name": "service", "path": "service", "children": [
        { "type": "file", "name": "budget-service", "path": "service.budget-service" }
      ] }
    ]
  }
]

// GET /api/admin/logs/{date}/{chemin}
[
  {
    "id": "…",
    "level": "critical",            // debug, info, notice, warning, error, critical
    "timestamp": "2026-10-27T23:12:44+01:00",
    "content": { "message": "…", "exception": { "class": "…", "message": "…", "file": "…", "line": 42, "trace": [] } },
    "context": { "action": "board.get.error", "ip": "…", "user_agent": "…" }
  }
]
```

La rotation et le nettoyage des fichiers anciens se font avec `php bin/console core-php:log-file-rotation`.

## Health-check

```json
{
  "status": "ok",
  "timestamp": "2026-10-28T02:00:00+01:00",
  "service": "budget-api",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy", "latency_ms": 1.2 },
    "storage": { "var_writable": true }
  },
  "system": { "php_version": "8.4.12", "environment": "dev", "memory_usage_mb": 4, "response_ms": 3.1 }
}
```

`status` passe à `degraded`, avec un code 503, si la base ne répond pas à `SELECT 1` ou si `var/` n'est pas accessible en écriture.

Point d'attention : la réponse est publique et donne la version de PHP et l'environnement. C'est utile pour une sonde de supervision, mais c'est aussi une information pour un attaquant en production.

## Où trouver le code

| Fichier | Rôle |
| --- | --- |
| `src/Controller/EmailPreviewerController.php` | Routes `api_admin_emails_*` |
| `src/Controller/Admin/LogController.php` | Routes `api_admin_logs_*` |
| `src/Controller/HealthCheckController.php` | Route `health_check` |
| `src/Service/EmailMockService.php` | Données factices et liste des aperçus |
| `src/Service/LogService.php` | Lecture de l'arborescence et des fichiers de log |

## Vérifications

Dans cette session, seul l'aperçu `board-invitation` a été appelé (200). Les autres routes n'ont pas été rejouées.
