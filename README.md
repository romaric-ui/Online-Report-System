Le README.md est obsolète. Remplace son contenu entièrement par ceci :

# 📊 SGTEC — Plateforme de Gestion de Chantier BTP

Application SaaS complète pour la gestion de chantiers BTP. Suivi en temps réel, gestion des équipes, matériel, budget, planification Gantt, sécurité HSE, documents et communication.

## 🚀 Stack technique

- **Frontend** : Next.js 15.5.3 · React 19 · Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : MySQL/MariaDB
- **Authentification** : NextAuth.js (credentials + Google OAuth 2.0)
- **PDF** : jsPDF + jsPDF-AutoTable
- **Email** : Nodemailer
- **Sécurité** : bcryptjs · validator · middleware headers

## 🎯 Fonctionnalités

### Authentification & Sécurité
- Connexion email/mot de passe + Google OAuth
- Vérification OTP par email
- Reset mot de passe
- Rôles : Admin site, Admin entreprise, Chef de chantier, Conducteur de travaux, Ouvrier

### Gestion multi-entreprise (multi-tenant)
- Inscription entreprise avec compte admin
- Données isolées par entreprise
- Système d'invitations par email ou lien
- Gestion des membres et rôles

### Gestion des chantiers
- Création et suivi de chantiers
- Journal de chantier quotidien (météo, travaux, problèmes)
- Galerie photos (avant/pendant/après)
- Progression en pourcentage

### Gestion des tâches
- Tâches par chantier et par lot
- Statut, priorité, pourcentage d'avancement
- Progression globale automatique

### Planification Gantt
- Diagramme de Gantt interactif
- Algorithme du chemin critique (CPM)
- Dépendances entre tâches (FS, FF, SS, SF)
- Jalons

### Gestion des équipes
- Annuaire des ouvriers
- Affectation aux chantiers
- Pointage quotidien (arrivée/départ/heures)

### Gestion du matériel
- Inventaire complet
- Affectation/retour par chantier
- Suivi de l'état

### Budget & Dépenses
- Budget par chantier
- Saisie des dépenses par catégorie
- Validation des dépenses (en attente/validée/rejetée)
- Synthèse : prévu vs dépensé vs reste

### Sécurité HSE
- Checklists de sécurité (quotidienne, ouverture, audit)
- Score de conformité automatique
- Déclaration et suivi d'incidents

### Documents
- Upload de documents par chantier (plans, contrats, devis, factures, permis)
- Classement par catégorie
- Téléchargement et suppression

### Communication
- Chat interne par chantier
- Messages en temps réel (polling)

### Rapports
- Rapports de chantier professionnels
- Génération PDF avec logo et pagination
- Dashboard projet avec KPIs globaux

### Administration
- Dashboard admin (stats utilisateurs, rapports)
- Gestion des utilisateurs (bloquer, supprimer, modifier rôle)
- Gestion des messages de support

## ⚡ Installation

### Prérequis
- Node.js 20+
- MySQL 8+ ou MariaDB 10.5+
- Compte Google Developer (optionnel, pour OAuth)

### 1. Cloner le projet
```bash
git clone https://github.com/romaric-ui/Online-Report-System.git
cd Online-Report-System
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
```bash
cp env.template .env.local
```

Éditez `.env.local` avec vos valeurs :
```env
# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=onlinereports
DB_PORT=3306
USE_LOCAL_DB=true

# NextAuth (OBLIGATOIRE)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=une-chaine-aleatoire-de-32-caracteres-minimum

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret

# Email (pour OTP et invitations)
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application
```

### 4. Créer la base de données

Exécutez les scripts SQL dans l'ordre suivant dans phpMyAdmin ou en ligne de commande :
```bash
# 1. Schéma de base (8 tables originales)
mysql -u root -p < database/schema.sql

# 2. Migrations (dans l'ordre !)
mysql -u root -p onlinereports < database/migrations/001_entreprises.sql
mysql -u root -p onlinereports < database/migrations/002_chantiers.sql
mysql -u root -p onlinereports < database/migrations/003_rapport_chantier.sql
mysql -u root -p onlinereports < database/migrations/004_equipes.sql
mysql -u root -p onlinereports < database/migrations/005_materiel.sql
mysql -u root -p onlinereports < database/migrations/006_budget.sql
mysql -u root -p onlinereports < database/migrations/007_planification.sql
mysql -u root -p onlinereports < database/migrations/008_hse.sql
mysql -u root -p onlinereports < database/migrations/009_documents.sql
mysql -u root -p onlinereports < database/migrations/010_chat.sql
mysql -u root -p onlinereports < database/migrations/011_invitations.sql
```

### 5. Créer le compte administrateur
```bash
node scripts/create-admin.js
```

Compte par défaut : `admin@sgtec.com` / `Admin@123`

### 6. Lancer l'application
```bash
npm run dev
```

Application accessible sur : **http://localhost:3000**

## 🗄️ Base de données

### Tables (20 tables)

| Table | Description |
|-------|-------------|
| Role | Rôles système (Administrateur, Utilisateur) |
| RoleEntreprise | Rôles par entreprise (admin, chef_chantier, conducteur, ouvrier) |
| Entreprise | Entreprises clientes |
| Utilisateur | Comptes utilisateurs |
| InvitationEntreprise | Invitations à rejoindre une entreprise |
| Rapport | Rapports de chantier |
| DonneesFormulaire | Champs dynamiques des rapports |
| ImageCouverture | Images de couverture des rapports |
| HistoriqueTelechargement | Historique des téléchargements PDF |
| Chantier | Chantiers de construction |
| Lot | Lots de travaux par chantier |
| Tache | Tâches par chantier |
| DependanceTache | Dépendances entre tâches (Gantt) |
| Jalon | Jalons de projet |
| JournalChantier | Journal quotidien de chantier |
| PhotoChantier | Photos de chantier |
| DocumentChantier | Documents (plans, contrats, devis...) |
| Ouvrier | Ouvriers de l'entreprise |
| AffectationChantier | Affectation ouvriers aux chantiers |
| Pointage | Pointage quotidien des ouvriers |
| Materiel | Inventaire du matériel |
| AffectationMateriel | Affectation matériel aux chantiers |
| BudgetChantier | Budget par chantier |
| Depense | Dépenses par chantier |
| ChecklistSecurite | Checklists HSE |
| ItemChecklist | Items des checklists |
| IncidentSecurite | Incidents de sécurité |
| Conversation | Conversations par chantier |
| ChatMessage | Messages de chat |
| Message | Messages de support |
| Notification | Notifications système |

## 📁 Structure du projet