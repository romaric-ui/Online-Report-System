# ROADMAP SGTEC — Guide de Développement Séquentiel

> **Règle d'or** : Chaque étape produit un résultat testable.
> Ne passe à l'étape suivante que quand la précédente fonctionne.

---

## ÉTAT ACTUEL DU PROJET (Point de départ)

### Stack technique

```
Framework   : Next.js 15.5.3 (App Router, Turbopack)
Frontend    : React 19.1.0 · Tailwind CSS 3.4.18
Auth        : NextAuth.js 4.24.11 (credentials + Google OAuth)
BDD         : MySQL/MariaDB via mysql2 3.15.1
PDF         : jsPDF 3.0.2 + jsPDF-AutoTable 5.0.2
Email       : Nodemailer 6.10.1
Icônes      : Lucide React 0.546.0 + React Icons 5.5.0
Sécurité    : bcryptjs 3.0.2 · validator 13.15.15
Déploiement : Netlify (plugin @netlify/plugin-nextjs)
Port dev    : localhost:3000
```

### Inventaire complet des fichiers existants

#### Routes API (20 fichiers route.js)

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.js        ← Config NextAuth (credentials + Google)
│   ├── login/route.js                ← Connexion classique
│   ├── logout/                       ← Déconnexion
│   ├── register/route.js             ← Inscription
│   ├── send-otp/route.js             ← Envoi code OTP par email
│   ├── verify-otp/route.js           ← Vérification code OTP
│   ├── forgot-password/route.js      ← Demande reset mot de passe
│   ├── reset-password/route.js       ← Reset mot de passe
│   ├── verify-reset-code/route.js    ← Vérification code de reset
│   ├── send-verification-code/       ← Envoi code vérification email
│   └── verify-code/                  ← Vérification code email
├── reports/
│   ├── route.js                      ← GET (mes rapports) + POST + PUT + DELETE
│   └── [id]/route.js                 ← GET/PUT/DELETE un rapport spécifique
├── uploads/
│   └── cover/route.js                ← Upload image de couverture
├── user/
│   └── notifications/route.js        ← GET + PUT notifications utilisateur
└── admin/
    ├── dashboard/route.js            ← Stats du dashboard admin
    ├── users/route.js                ← Liste des utilisateurs
    ├── users/[id]/route.js           ← GET/PUT/DELETE un utilisateur
    ├── reports/route.js              ← Gestion des rapports (validation/rejet)
    ├── messages/route.js             ← Messages de support
    ├── messages/reply/route.js       ← Répondre à un message
    ├── notifications/route.js        ← Notifications admin
    └── create-admin/route.js         ← Création compte admin
```

#### Pages (13 fichiers page.jsx)

```
src/app/
├── page.jsx                          ← Landing page (Hero, Features, Pricing, FAQ, CTA)
├── dashboard/page.jsx                ← Dashboard utilisateur (liste rapports)
├── reports/new/page.jsx              ← Création d'un nouveau rapport
├── forgot-password/page.jsx          ← Page "Mot de passe oublié"
├── reset-password/page.jsx           ← Page de reset du mot de passe
├── verify-email/page.jsx             ← Page de vérification email
├── verify-otp/page.jsx               ← Page de saisie du code OTP
└── admin/
    ├── page.jsx                      ← Page d'accueil admin (redirection)
    ├── dashboard/page.jsx            ← Dashboard admin (stats, activité)
    ├── users/page.jsx                ← Gestion des utilisateurs
    ├── reports/page.jsx              ← Gestion des rapports (valider/rejeter)
    ├── messages/page.jsx             ← Gestion des messages de support
    └── create-admin/page.jsx         ← Formulaire création admin
```

#### Composants (17 fichiers .jsx)

```
src/app/components/
├── AuthModal.jsx                     ← Modal connexion/inscription
├── AuthProvider.jsx                  ← Provider NextAuth (SessionProvider)
├── GoogleSignInButton.jsx            ← Bouton "Continuer avec Google"
├── Header.jsx                        ← Navigation principale
├── ImageCoverUpload.jsx              ← Upload image de couverture pour rapports
├── ReportForm.jsx                    ← Formulaire de rapport complet (1152 lignes)
├── NotificationCenter.jsx            ← Cloche de notifications + dropdown
├── MessageModal.jsx                  ← Modal de contact/support
├── Toast.jsx                         ← Composant toast (succès/erreur)
├── ToastProvider.jsx                 ← Context provider pour les toasts
├── LandingHero.jsx                   ← Section hero de la landing
├── LandingFeatures.jsx               ← Section fonctionnalités
├── LandingPricing.jsx                ← Section tarification (placeholder)
├── LandingTestimonials.jsx           ← Section témoignages
├── LandingFAQ.jsx                    ← Section FAQ
├── LandingCTA.jsx                    ← Section appel à l'action
└── LandingFooter.jsx                 ← Pied de page
```

#### Librairies (lib/ — 6 fichiers)

```
lib/
├── database.js                       ← Pool MySQL + fonctions CRUD legacy
├── security.js                       ← Validation email, password, noms, sanitisation
├── security-config.js                ← Config rate limiting, patterns, limites
├── email-service.js                  ← Nodemailer + templates HTML (OTP, reset)
├── notifications.js                  ← createNotification() simple
└── otp-store.js                      ← Stockage temporaire des codes OTP
```

#### Autres fichiers

```
middleware.js                         ← Headers de sécurité (CSP, XSS, CORS)
database/schema.sql                   ← Schéma complet (8 tables)
database/migration.sql                ← Migrations manuelles (ALTER TABLE)
scripts/init-database.js              ← Script d'initialisation BDD
scripts/create-admin.js               ← Script création admin
scripts/init-roles.js                 ← Script initialisation des rôles
env.template                          ← Template des variables d'environnement
```

### Schéma SQL actuel (8 tables)

```
Role (id_role, nom_role, description)
  └─→ Utilisateur (id_utilisateur, nom, prenom, email, telephone, mot_de_passe,
                    provider, provider_id, id_role, statut, email_verified,
                    date_creation, derniere_connexion)
         ├─→ Rapport (id_rapport, numero_affaire, numero_rapport, nom_chantier,
         │            adresse_chantier, date_visite, phase, equipe_presente JSON,
         │            materiel_utilise JSON, objectifs_limites, deroulement,
         │            investigation JSON, autres_points JSON, conclusion,
         │            photo_couverture, statut, titre, description, fichier_pdf,
         │            image_couverture, image_couverture_type, id_utilisateur,
         │            commentaire_admin, id_validateur, date_validation,
         │            date_creation, date_modification)
         │      ├─→ DonneesFormulaire (id_donnee, champ_nom, champ_valeur, id_rapport)
         │      ├─→ ImageCouverture (id_image, id_rapport, nom_fichier, ...)
         │      └─→ HistoriqueTelechargement (id_telechargement, id_utilisateur, id_rapport)
         ├─→ otp_verification (id, user_id, email, otp_code, expires_at)
         ├─→ PasswordReset (id, id_utilisateur, code, email, expires_at, used)
         ├─→ Message (id_message, id_utilisateur, nom, email, sujet, contenu, statut, ...)
         └─→ Notification (id_notification, id_utilisateur, type_notification, titre, ...)
```

### Problèmes connus à corriger

1. **Double config DB** : `lib/database.js` (pool) ET `api/auth/[...nextauth]/route.js` (connexion directe lignes 8-35)
2. **Pas de pattern repository** : SQL directement dans les routes API
3. **Pas de tests** : zéro fichier de test
4. **`lib/database.js` mélange tout** : config + pool + CRUD (getAllReports, createReport, etc.)
5. **ReportForm.jsx = 1152 lignes** : trop gros
6. **Migrations manuelles** : pas de versioning
7. **LandingPricing.jsx** : prix placeholder ("Bientôt disponible")

---

## SPRINT 1 — Nettoyage & Fondations (Semaine 1-2)

> **Objectif** : Unifier la config DB, créer le pattern repository,
> standardiser les réponses API. NE RIEN CASSER de l'existant.

### Étape 1.1 — Unifier la connexion DB

**Problème** : `lib/database.js` utilise un pool, mais `api/auth/[...nextauth]/route.js`
crée sa propre connexion avec sa propre config DB dupliquée (lignes 8-35).

**Action** :

```
MODIFIER : lib/database.js
  → Garder le pool et connectDB()
  → SUPPRIMER toutes les fonctions CRUD :
    - getAllReports(), createReport(), updateReport(), deleteReport()
    - logDownload(), saveImageCouverture(), getImageCouverture()
    - updateImageCouverture(), deleteImageCouverture()
    - detectDatabaseStructure(), reportsCache
  → Garder UNIQUEMENT : connectDB(), closeDB()

MODIFIER : src/app/api/auth/[...nextauth]/route.js
  → SUPPRIMER lignes 1-35 (import mysql, config DB locale, getDbConnection)
  → AJOUTER : import { connectDB } from '../../../../lib/database.js';
  → REMPLACER chaque getDbConnection() par connectDB()
  → SUPPRIMER chaque connection.end() (le pool gère les connexions)
```

**Test** : Connexion credentials + Google → les deux fonctionnent toujours.

### Étape 1.2 — Classes d'erreurs

```
CRÉER : lib/errors/index.js
  Classes à exporter :
  - AppError(message, statusCode, code)
  - ValidationError(message, details?)            → 400
  - AuthenticationError(message?)                  → 401
  - AuthorizationError(message?)                   → 403
  - NotFoundError(message?)                        → 404
  - ConflictError(message?)                        → 409
  - RateLimitError(message?, retryAfter?)          → 429
  - PlanLimitError(message?, upgradeHint?)         → 403
```

### Étape 1.3 — Logger

```
CRÉER : lib/logger.js
  Export : logger.error(msg, meta), logger.warn(), logger.info(), logger.debug()
  Dev  : console avec emojis et couleurs
  Prod : JSON structuré { timestamp, level, message, ...meta }
```

### Étape 1.4 — Réponses API standardisées

```
CRÉER : lib/api-response.js
  Export :
  - successResponse(data, statusCode=200)
  - createdResponse(data)
  - paginatedResponse(data, { page, limit, total })
  - errorResponse(error)
  - apiHandler(fn)  ← wrapper try/catch automatique
```

### Étape 1.5 — BaseRepository

```
CRÉER : lib/repositories/base.repository.js
  Classe avec : findById, findOneBy, findAll, findBy, create, update, delete,
                count, raw, transaction
```

### Étape 1.6 — Repositories spécifiques

```
CRÉER : lib/repositories/user.repository.js
  → findByEmail, findByGoogleId, createGoogleUser, createLocalUser,
    updateLastLogin, findAllWithRole, blockUser, unblockUser
  → Export : const userRepo = new UserRepository()

CRÉER : lib/repositories/report.repository.js
  → findByUser, findWithCreator, findAllAdmin, countByUser, countByStatus,
    validate, reject
  → Export : const reportRepo = new ReportRepository()

CRÉER : lib/repositories/notification.repository.js
  → findByUser, countUnread, markAsRead, markAllAsRead
  → Export : const notifRepo = new NotificationRepository()

CRÉER : lib/repositories/message.repository.js
  → findAll, reply, markAsRead
  → Export : const messageRepo = new MessageRepository()
```

### Étape 1.7 — Migrer src/app/api/reports/route.js vers le nouveau pattern

Remplacer le SQL direct par les repositories + apiHandler.
**Tester** : le dashboard affiche toujours les rapports.

### Étape 1.8 — Migrer toutes les autres routes API (une par une)

```
Ordre de migration :
 1. src/app/api/reports/[id]/route.js
 2. src/app/api/user/notifications/route.js
 3. src/app/api/admin/dashboard/route.js
 4. src/app/api/admin/users/route.js
 5. src/app/api/admin/users/[id]/route.js
 6. src/app/api/admin/reports/route.js
 7. src/app/api/admin/messages/route.js
 8. src/app/api/admin/messages/reply/route.js
 9. src/app/api/admin/notifications/route.js
10. src/app/api/admin/create-admin/route.js
```

Tester après CHAQUE fichier migré.

### Étape 1.9 — Migrer NextAuth vers UserRepository

Remplacer les requêtes SQL dans authorize(), signIn(), jwt() par les méthodes du userRepo.
**Tester** : credentials + Google + OTP fonctionnent.

---

## SPRINT 2 — Multi-tenant & Entreprises (Semaine 3-4)

> **Objectif** : Isoler les données par entreprise.

### Étape 2.1 — Table Entreprise + colonnes id_entreprise
### Étape 2.2 — Helper tenant + mise à jour des repositories
### Étape 2.3 — Page et API d'inscription entreprise

---

## SPRINT 3 — Gestion des Chantiers (Semaine 5-7)

> **Objectif** : Chantiers, journal quotidien, photos, tâches.

### Étape 3.1 — Tables : Chantier, Lot, JournalChantier, PhotoChantier, Tache
### Étape 3.2 — Repository + 6 routes API
### Étape 3.3 — 6 pages UI (liste, création, dashboard, journal, photos, tâches)
### Étape 3.4 — Lier les rapports existants aux chantiers
### Étape 3.5 — Mettre à jour Header.jsx (ajouter lien Chantiers)

---

## SPRINT 4 — Gestion des Équipes (Semaine 8-9)

### Étape 4.1 — Tables : Ouvrier, AffectationChantier, Pointage
### Étape 4.2 — Repository + API
### Étape 4.3 — Pages : ouvriers, affectation, pointage quotidien

---

## SPRINT 5 — Gestion du Matériel (Semaine 10-11)

### Étape 5.1 — Tables : Materiel, AffectationMateriel
### Étape 5.2 — Repository + API + Pages

---

## SPRINT 6 — Budget & Dépenses (Semaine 12-13)

### Étape 6.1 — Tables : BudgetChantier, Depense
### Étape 6.2 — Repository + API + Page budget

---

## SPRINT 7 — Planification Gantt (Semaine 14-16)

### Étape 7.1 — Étendre Tache + créer DependanceTache, Jalon
### Étape 7.2 — Algorithme CPM (lib/algorithms/cpm.js)
### Étape 7.3 — API + Page Gantt interactive

---

## SPRINT 8 — Module HSE Sécurité (Semaine 17-18)

### Étape 8.1 — Tables : ChecklistSecurite, ItemChecklist, IncidentSecurite
### Étape 8.2 — API + Pages

---

## SPRINT 9 — Abonnements & Paiement (Semaine 19-20)

### Étape 9.1 — Tables : Plan, Abonnement
### Étape 9.2 — Middleware plan-guard
### Étape 9.3 — Stripe Checkout + Webhooks
### Étape 9.4 — Mettre à jour LandingPricing.jsx

---

## SPRINT 10 — Dashboard Avancé & Finalisation (Semaine 21-22)

### Étape 10.1 — Dashboard global enrichi
### Étape 10.2 — Navigation complète
### Étape 10.3 — Tests (vitest + playwright)

---

## RÈGLES POUR L'IA DÉVELOPPEUR

```
1.  UNE ÉTAPE À LA FOIS. Ne jamais sauter une étape.
2.  TESTER après chaque étape. Si ça casse, corriger avant de continuer.
3.  NE JAMAIS CASSER L'EXISTANT. Auth, rapports, admin doivent toujours marcher.
4.  ORDRE : Migration SQL → Repository → API route → Page UI.
5.  TOUJOURS filtrer par id_entreprise (à partir du Sprint 2).
6.  RÉPONSES API au format : { success: true/false, data/error }.
7.  REQUÊTES PRÉPARÉES uniquement — jamais de concaténation SQL.
8.  IMPORTER depuis lib/ — jamais dupliquer la config DB.
9.  UN COMMIT = une étape terminée, message clair en français.
10. EN CAS DE DOUTE → relire cette roadmap, pas inventer.
```

## FICHIERS EXISTANTS — NE PAS SUPPRIMER

```
Modifier uniquement quand la roadmap le demande explicitement.

ROUTES AUTH (toucher seulement en 1.1 et 1.9) :
  src/app/api/auth/[...nextauth]/route.js
  src/app/api/auth/login/route.js
  src/app/api/auth/logout/
  src/app/api/auth/register/route.js
  src/app/api/auth/send-otp/route.js
  src/app/api/auth/verify-otp/route.js
  src/app/api/auth/forgot-password/route.js
  src/app/api/auth/reset-password/route.js
  src/app/api/auth/verify-reset-code/route.js
  src/app/api/auth/send-verification-code/
  src/app/api/auth/verify-code/

ROUTES MÉTIER (migrer en 1.7 et 1.8) :
  src/app/api/reports/route.js
  src/app/api/reports/[id]/route.js
  src/app/api/uploads/cover/route.js
  src/app/api/user/notifications/route.js

ROUTES ADMIN (migrer en 1.8) :
  src/app/api/admin/dashboard/route.js
  src/app/api/admin/users/route.js
  src/app/api/admin/users/[id]/route.js
  src/app/api/admin/reports/route.js
  src/app/api/admin/messages/route.js
  src/app/api/admin/messages/reply/route.js
  src/app/api/admin/notifications/route.js
  src/app/api/admin/create-admin/route.js

COMPOSANTS (17 fichiers — ne pas toucher sauf indication) :
  src/app/components/AuthModal.jsx
  src/app/components/AuthProvider.jsx
  src/app/components/GoogleSignInButton.jsx
  src/app/components/Header.jsx
  src/app/components/ImageCoverUpload.jsx
  src/app/components/ReportForm.jsx
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

PAGES (13 fichiers — ne pas toucher sauf indication) :
  src/app/page.jsx
  src/app/dashboard/page.jsx
  src/app/reports/new/page.jsx
  src/app/forgot-password/page.jsx
  src/app/reset-password/page.jsx
  src/app/verify-email/page.jsx
  src/app/verify-otp/page.jsx
  src/app/admin/page.jsx
  src/app/admin/dashboard/page.jsx
  src/app/admin/users/page.jsx
  src/app/admin/reports/page.jsx
  src/app/admin/messages/page.jsx
  src/app/admin/create-admin/page.jsx

LIB (6 fichiers — modifier en Sprint 1 uniquement) :
  lib/database.js
  lib/security.js
  lib/security-config.js
  lib/email-service.js
  lib/notifications.js
  lib/otp-store.js

AUTRES (ne pas toucher) :
  middleware.js
  database/schema.sql
  database/migration.sql
  scripts/init-database.js
  scripts/create-admin.js
  scripts/init-roles.js
```
