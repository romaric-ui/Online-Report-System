# AI-INSTRUCTIONS.md
# ================================================================
# INSTRUCTIONS POUR L'IA — Lire ce fichier AVANT toute action
# ================================================================
#
# Ce fichier guide l'IA développeur étape par étape.
# Il contient TOUT le contexte nécessaire : état du projet,
# roadmap, règles, et fichiers à ne pas toucher.
#
# USAGE : Coller ce fichier à la racine du projet.
# Quand tu démarres une session avec l'IA, dis-lui :
#   "Lis AI-INSTRUCTIONS.md et dis-moi où on en est."
# ================================================================


## QUI TU ES

Tu es un développeur senior Next.js / React / MySQL.
Tu travailles sur le projet SGTEC — une plateforme SaaS de gestion de chantier BTP.
Tu dois suivre cette roadmap étape par étape, SANS SAUTER D'ÉTAPE.


## STACK TECHNIQUE

```
Framework   : Next.js 15.5.3 (App Router, Turbopack)
Frontend    : React 19.1.0 · Tailwind CSS 3.4.18
Auth        : NextAuth.js 4.24.11 (credentials + Google OAuth)
BDD         : MySQL/MariaDB via mysql2 3.15.1
PDF         : jsPDF 3.0.2 + jsPDF-AutoTable 5.0.2
Email       : Nodemailer 6.10.1
Icônes      : Lucide React 0.546.0 + React Icons 5.5.0
Sécurité    : bcryptjs 3.0.2 · validator 13.15.15
Port dev    : localhost:3000
```


## ÉTAT ACTUEL — CE QUI EXISTE DÉJÀ

### Routes API existantes (20 fichiers — NE PAS SUPPRIMER)

```
src/app/api/auth/[...nextauth]/route.js     ← NextAuth config
src/app/api/auth/login/route.js             ← Connexion credentials
src/app/api/auth/logout/                    ← Déconnexion
src/app/api/auth/register/route.js          ← Inscription
src/app/api/auth/send-otp/route.js          ← Envoi OTP email
src/app/api/auth/verify-otp/route.js        ← Vérification OTP
src/app/api/auth/forgot-password/route.js   ← Demande reset password
src/app/api/auth/reset-password/route.js    ← Reset password
src/app/api/auth/verify-reset-code/route.js ← Vérif code reset
src/app/api/auth/send-verification-code/    ← Envoi code vérif email
src/app/api/auth/verify-code/              ← Vérif code email
src/app/api/reports/route.js               ← CRUD rapports (GET+POST+PUT+DELETE)
src/app/api/reports/[id]/route.js          ← Rapport spécifique
src/app/api/uploads/cover/route.js         ← Upload image couverture
src/app/api/user/notifications/route.js    ← Notifications user
src/app/api/admin/dashboard/route.js       ← Stats admin
src/app/api/admin/users/route.js           ← Liste users
src/app/api/admin/users/[id]/route.js      ← CRUD user admin
src/app/api/admin/reports/route.js         ← Validation/rejet rapports
src/app/api/admin/messages/route.js        ← Messages support
src/app/api/admin/messages/reply/route.js  ← Réponse message
src/app/api/admin/notifications/route.js   ← Notifications admin
src/app/api/admin/create-admin/route.js    ← Création admin
```

### Pages existantes (13 fichiers — NE PAS SUPPRIMER)

```
src/app/page.jsx                       ← Landing page
src/app/dashboard/page.jsx             ← Dashboard utilisateur
src/app/reports/new/page.jsx           ← Nouveau rapport
src/app/forgot-password/page.jsx       ← Mot de passe oublié
src/app/reset-password/page.jsx        ← Reset mot de passe
src/app/verify-email/page.jsx          ← Vérification email
src/app/verify-otp/page.jsx            ← Saisie OTP
src/app/admin/page.jsx                 ← Accueil admin
src/app/admin/dashboard/page.jsx       ← Dashboard admin
src/app/admin/users/page.jsx           ← Gestion users
src/app/admin/reports/page.jsx         ← Gestion rapports
src/app/admin/messages/page.jsx        ← Gestion messages
src/app/admin/create-admin/page.jsx    ← Création admin
```

### Composants existants (17 fichiers — NE PAS SUPPRIMER)

```
src/app/components/AuthModal.jsx
src/app/components/AuthProvider.jsx
src/app/components/GoogleSignInButton.jsx
src/app/components/Header.jsx
src/app/components/ImageCoverUpload.jsx
src/app/components/ReportForm.jsx           ← 1152 lignes
src/app/components/NotificationCenter.jsx
src/app/components/MessageModal.jsx
src/app/components/Toast.jsx
src/app/components/ToastProvider.jsx
src/app/components/LandingHero.jsx
src/app/components/LandingFeatures.jsx
src/app/components/LandingPricing.jsx
src/app/components/LandingTestimonials.jsx
src/app/components/LandingFAQ.jsx
src/app/components/LandingCTA.jsx
src/app/components/LandingFooter.jsx
```

### Librairies existantes (6 fichiers)

```
lib/database.js          ← Pool MySQL + fonctions CRUD legacy (à nettoyer Sprint 1)
lib/security.js          ← Validation, sanitisation
lib/security-config.js   ← Config rate limiting, patterns
lib/email-service.js     ← Nodemailer + templates HTML
lib/notifications.js     ← createNotification()
lib/otp-store.js         ← Stockage temporaire OTP
```

### Autres fichiers existants

```
middleware.js             ← Headers sécurité (CSP, XSS)
database/schema.sql       ← Schéma 8 tables
database/migration.sql    ← Migrations manuelles
scripts/init-database.js
scripts/create-admin.js
scripts/init-roles.js
env.template
```

### Schéma SQL actuel (8 tables)

```
Role → Utilisateur → Rapport → DonneesFormulaire
                 │         └→ ImageCouverture
                 │         └→ HistoriqueTelechargement
                 ├→ otp_verification
                 ├→ PasswordReset
                 ├→ Message
                 └→ Notification
```

### Problèmes connus (à corriger dans Sprint 1)

1. Double config DB : lib/database.js ET api/auth/[...nextauth]/route.js ont chacun leur config
2. Pas de pattern repository : SQL directement dans les routes API
3. Pas de tests
4. lib/database.js mélange config + CRUD
5. Migrations manuelles, pas de versioning


## PROGRESSION — OÙ EN EST-ON ?

> Met à jour cette section après chaque étape complétée.
> Remplace [ ] par [x] quand l'étape est terminée.

### Sprint 1 — Fondations ✅ COMPLET
### Sprint 2 — Multi-tenant ✅ COMPLET
### Sprint 3 — Chantiers ✅ COMPLET
### Sprint 4 — Équipes ✅ COMPLET
### Sprint 5 — Matériel ✅ COMPLET
### Sprint 6 — Budget ✅ COMPLET
### Sprint 7 — Gantt ✅ COMPLET
### Sprint 8 — HSE ✅ COMPLET
### Sprint 9A — Dashboard Projet ✅ COMPLET
### Sprint 9B — Documents ✅ COMPLET
### Sprint 9C — Rapports automatiques ⏸ EN PAUSE
### Sprint 9D — Chat ✅ COMPLET
### Sprint 9E — Invitations & Rôles ✅ COMPLET (9E.1 à 9E.4)

### Sprint 9F — Corrections & UX
- [x] 9F.1 — Redirection utilisateur connecté vers dashboard
- [x] 9F.2 — Sidebar Archireport + tabs chantier
- [x] 9F.3 — Page profil (infos, photo, mot de passe)
- [x] 9F.4 — Redesign dashboard projet (KPIs animés, cards)
- [x] 9F.5 — Module HSE complet (stock, vérifications, mouvements)
- [x] 9F.6 — Photo profil mise à jour immédiatement
- [x] 9F.7 — Admin SGTEC séparé (/admin-login + lien footer)
- [x] 9F.8 — Redirection post-inscription vers /dashboard-projet

### Sprint 10 — Abonnements & Paiement
- [x] 10.1 — Tables Plan + Abonnement (014_abonnements.sql)
- [x] 10.2 — plan-guard.js (checkPlanLimit, checkFeature)
- [x] 10.3 — Vérifications plan dans routes API
- [x] 10.4 — Page /abonnement (plan actuel, cards, toggle)
- [x] 10.5 — LandingPricing.jsx (29€/79€, toggle annuel)
- [x] 10.6 — Stripe Checkout + Webhooks + Cancel
- [x] 10.7 — Plan Essentiel : 5 chantiers max, essai gratuit = 1 chantier

### Sprint 9G — Design System & Landing Redesign
- [x] 9G.1 — Landing page redesignée (vidéo BG, dark navy, jaune, animations scroll)
- [x] 9G.2 — LandingFeatureShowcase (3 blocs alternés avec illustrations CSS)
- [x] 9G.3 — Système de design : variables CSS + neumorphism + mode nuit
- [x] 9G.4 — Boutons et inputs style soft UI dans toute l'app

### Sprint 11 — Finalisation
- [ ] 11.1 — Validations obligatoires sur tous les formulaires
- [ ] 11.2 — Navigation complète et cohérente
- [ ] 11.3 — Tests (vitest + playwright)
- [ ] 11.4 — Déploiement production


## MIGRATIONS SQL À EXÉCUTER DANS L'ORDRE

```
001_entreprises.sql
002_chantiers.sql
003_rapport_chantier.sql
004_equipes.sql
005_materiel.sql
006_budget.sql
007_planification.sql
008_hse.sql
009_documents.sql
010_chat.sql
011_invitations.sql
012_user_avatar.sql
013_hse_stock.sql
014_abonnements.sql
```


## VARIABLES D'ENVIRONNEMENT REQUISES

```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
NEXTAUTH_URL, NEXTAUTH_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM_NAME
STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ESSENTIEL_MENSUEL, STRIPE_PRICE_ESSENTIEL_ANNUEL
STRIPE_PRICE_PRO_MENSUEL, STRIPE_PRICE_PRO_ANNUEL
```


## ÉTAT ACTUEL — PROCHAINE ÉTAPE

Sprint 11.1 — Validations obligatoires sur tous les formulaires


## DÉTAIL DES SPRINTS

### ═══════════════════════════════════════
### SPRINT 1 — Nettoyage & Fondations
### ═══════════════════════════════════════

#### Étape 1.1 — Unifier la connexion DB

MODIFIER lib/database.js :
- Garder connectDB() et closeDB()
- SUPPRIMER : getAllReports, createReport, updateReport, deleteReport,
  logDownload, saveImageCouverture, getImageCouverture,
  updateImageCouverture, deleteImageCouverture,
  detectDatabaseStructure, reportsCache

MODIFIER src/app/api/auth/[...nextauth]/route.js :
- Supprimer lignes 1-35 (import mysql, config DB dupliquée, getDbConnection)
- Ajouter : import { connectDB } from '../../../../lib/database.js';
- Remplacer chaque getDbConnection() → connectDB()
- Supprimer chaque connection.end() (le pool gère)

TEST : Connexion credentials + Google → fonctionnent.


#### Étape 1.2 — Classes d'erreurs

CRÉER lib/errors/index.js :
```js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
export class ValidationError extends AppError {
  constructor(message = 'Données invalides', details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}
export class AuthenticationError extends AppError {
  constructor(message = 'Authentification requise') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}
export class AuthorizationError extends AppError {
  constructor(message = 'Accès non autorisé') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND');
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflit de données') {
    super(message, 409, 'CONFLICT');
  }
}
export class RateLimitError extends AppError {
  constructor(message = 'Trop de requêtes', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}
export class PlanLimitError extends AppError {
  constructor(message = 'Limite du plan atteinte', upgradeHint = null) {
    super(message, 403, 'PLAN_LIMIT_EXCEEDED');
    this.upgradeHint = upgradeHint;
  }
}
```


#### Étape 1.3 — Logger

CRÉER lib/logger.js :
- Exporter logger.error(msg, meta), logger.warn(), logger.info(), logger.debug()
- En dev : console avec emojis (❌ ⚠️ ℹ️ 🔍)
- En prod : JSON { timestamp, level, message, ...meta }
- Configurable via LOG_LEVEL dans .env


#### Étape 1.4 — Réponses API standardisées

CRÉER lib/api-response.js :
```js
import { NextResponse } from 'next/server';
import { AppError } from './errors/index.js';
import { logger } from './logger.js';

export function successResponse(data = null, statusCode = 200, meta = null) {
  const body = { success: true };
  if (data !== null) body.data = data;
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status: statusCode });
}

export function createdResponse(data) {
  return successResponse(data, 201);
}

export function paginatedResponse(data, { page, limit, total }) {
  return successResponse(data, 200, {
    page: parseInt(page), limit: parseInt(limit),
    total, totalPages: Math.ceil(total / limit)
  });
}

export function errorResponse(error, request = null) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) logger.error(error.message, { stack: error.stack });
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  logger.error('Erreur inattendue', { message: error.message, stack: error.stack });
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur interne' } },
    { status: 500 }
  );
}

export function apiHandler(handler) {
  return async (request, context) => {
    try { return await handler(request, context); }
    catch (error) { return errorResponse(error, request); }
  };
}
```


#### Étape 1.5 — BaseRepository

CRÉER lib/repositories/base.repository.js :
- Classe BaseRepository(tableName, primaryKey)
- Méthodes : findById, findOneBy, findAll({ page, limit, orderBy, where, params }),
  findBy(criteria), create(data), update(id, data), delete(id),
  count(where, params), raw(sql, params), transaction(callback)
- Utilise connectDB() de lib/database.js
- Throw NotFoundError quand approprié


#### Étape 1.6 — Repositories spécifiques

CRÉER lib/repositories/user.repository.js :
- extends BaseRepository('Utilisateur', 'id_utilisateur')
- findByEmail(email), findByGoogleId(providerId), createGoogleUser(profile),
  createLocalUser(data), updateLastLogin(id), findAllWithRole({ page, limit }),
  blockUser(id), unblockUser(id)
- Export : const userRepo = new UserRepository();

CRÉER lib/repositories/report.repository.js :
- extends BaseRepository('Rapport', 'id_rapport')
- findByUser(userId, { page, limit, search, statut, sort }),
  findWithCreator(id), findAllAdmin({ page, limit, search, statut }),
  countByUser(userId), countByStatus(), validate(id, adminId, commentaire),
  reject(id, adminId, commentaire)
- Export : const reportRepo = new ReportRepository();

CRÉER lib/repositories/notification.repository.js :
- extends BaseRepository('Notification', 'id_notification')
- findByUser(userId, { onlyUnread }), countUnread(userId),
  markAsRead(id, userId), markAllAsRead(userId)
- Export : const notifRepo = new NotificationRepository();

CRÉER lib/repositories/message.repository.js :
- extends BaseRepository('Message', 'id_message')
- findAll({ page, limit, statut }), reply(id, reponse, adminId), markAsRead(id)
- Export : const messageRepo = new MessageRepository();


#### Étape 1.7 — Migrer api/reports/route.js

Remplacer le SQL direct par reportRepo + apiHandler + successResponse.
TEST : /dashboard affiche les rapports.


#### Étape 1.8 — Migrer les autres routes API (une par une)

Ordre :
1. api/reports/[id]/route.js
2. api/user/notifications/route.js
3. api/admin/dashboard/route.js
4. api/admin/users/route.js
5. api/admin/users/[id]/route.js
6. api/admin/reports/route.js
7. api/admin/messages/route.js
8. api/admin/messages/reply/route.js
9. api/admin/notifications/route.js
10. api/admin/create-admin/route.js

TESTER après CHAQUE migration.


#### Étape 1.9 — Migrer NextAuth

Dans src/app/api/auth/[...nextauth]/route.js :
- authorize() → userRepo.findByEmail()
- signIn() Google → userRepo.findByEmail() + userRepo.createGoogleUser()
- jwt() → userRepo.findByEmail()
TEST : Connexion credentials + Google + OTP fonctionnent.


### ═══════════════════════════════════════
### SPRINT 2 — Multi-tenant (détail dans ROADMAP-SGTEC.md)
### SPRINT 3 — Chantiers (détail dans ROADMAP-SGTEC.md)
### SPRINT 4 — Équipes (détail dans ROADMAP-SGTEC.md)
### SPRINT 5 — Matériel (détail dans ROADMAP-SGTEC.md)
### SPRINT 6 — Budget (détail dans ROADMAP-SGTEC.md)
### SPRINT 7 — Gantt (détail dans ROADMAP-SGTEC.md)
### SPRINT 8 — HSE (détail dans ROADMAP-SGTEC.md)
### SPRINT 9 — Abonnements (détail dans ROADMAP-SGTEC.md)
### SPRINT 10 — Finalisation (détail dans ROADMAP-SGTEC.md)
### ═══════════════════════════════════════


## 10 RÈGLES ABSOLUES

```
1.  UNE ÉTAPE À LA FOIS. Ne jamais sauter.
2.  TESTER après chaque étape. Corriger avant de continuer.
3.  NE JAMAIS CASSER L'EXISTANT.
4.  ORDRE : SQL → Repository → API → UI.
5.  FILTRER par id_entreprise (à partir du Sprint 2).
6.  RÉPONSES API : { success: true/false, data/error }.
7.  REQUÊTES PRÉPARÉES uniquement.
8.  IMPORTER depuis lib/ — jamais dupliquer.
9.  UN COMMIT = une étape.
10. DOUTE → relire ce fichier.
```


## COMMENT DÉMARRER UNE SESSION

Dis à l'IA :

> "Lis le fichier AI-INSTRUCTIONS.md à la racine du projet.
> Regarde la section PROGRESSION pour savoir quelle étape est la prochaine.
> Implémente UNIQUEMENT cette étape, teste, puis dis-moi quand c'est fait."
