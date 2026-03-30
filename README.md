# 📊 Online Report System (SGTEC)

Application Next.js moderne avec système d'authentification complet permettant la création, gestion et génération de rapports **de chantier** professionnels au format PDF.

## 🎯 Rôle complet du site

- **Digitaliser les rapports de chantier** (Next.js, React, MySQL/MariaDB, jsPDF) : remplacer les comptes-rendus papier ou Excel par une solution web centralisée.
- **Standardiser la rédaction des comptes-rendus** (Next.js, React, Tailwind CSS) : imposer une structure unique pour tous les rapports de chantier (infos chantier, équipe, matériel, avancement, incidents, photos, etc.).
- **Assurer la traçabilité des interventions** (MySQL/MariaDB, timestamps SQL, JWT) : historiser la création, modification et suppression des rapports, avec lien à chaque utilisateur et à chaque chantier.
- **Faciliter la collaboration terrain / bureau** (Next.js, NextAuth.js, rôles user/admin) : permettre aux techniciens, conducteurs de travaux et responsables de consulter et exploiter les mêmes rapports.
- **Fournir des livrables professionnels au client** (jsPDF, jsPDF-AutoTable) : générer automatiquement des PDF propres, paginés, prêts à être envoyés au maître d’ouvrage ou archivés.
- **Superviser l’activité des chantiers** (Dashboard Next.js, MySQL/MariaDB) : offrir aux administrateurs une vision d’ensemble des chantiers, rapports et utilisateurs (dashboard, statistiques).
- **Sécuriser les informations sensibles de chantier** (NextAuth.js, bcryptjs, middleware Next.js) : contrôler l’accès par authentification, rôles (user/admin) et bonnes pratiques de sécurité (hash des mots de passe, CSRF, XSS, etc.).
- **Centraliser les données chantiers** (MySQL/MariaDB, schéma SQL) : stocker tous les rapports dans une base de données unique pour faciliter la recherche, le suivi et les audits.

## 🚀 Fonctionnalités principales

### 🔐 Authentification & Sécurité
- ✅ **Google OAuth 2.0** (NextAuth.js, API Google OAuth 2.0) - Connexion rapide avec votre compte Google
- ✅ **Authentification locale** (NextAuth.js Credentials, bcryptjs, MySQL) - Système de connexion classique avec email/mot de passe
- ✅ **NextAuth.js** (NextAuth.js, JWT) - Gestion sécurisée des sessions
- ✅ **Sécurité avancée** (Next.js, validations & sanitisation côté serveur) - Validation, sanitisation, protection CSRF
- ✅ **Middleware de sécurité** (Next.js Middleware) - Protection des routes sensibles

### 📝 Gestion des rapports
- ✅ **CRUD complet** (Next.js API Routes, MySQL/MariaDB) - Créer, lire, modifier, supprimer des rapports
- ✅ **Upload d'images** (Next.js File API) - Images de couverture avec redimensionnement automatique
- ✅ **Tableaux structurés** (React, Tailwind CSS) - Investigation et autres points avec photos
- ✅ **Génération PDF professionnelle** (jsPDF, jsPDF-AutoTable) - Avec jsPDF + autotable
- ✅ **Pagination avancée** (jsPDF) - Page de garde non numérotée
- ✅ **Filtrage intelligent** (MySQL/MariaDB, requêtes filtrées) - Seules les données pertinentes sont incluses

### 👥 Administration
- ✅ **Dashboard admin** - Gestion des utilisateurs et rapports
- ✅ **Statistiques** - Vue d'ensemble des comptes et activités
- ✅ **API robuste** - Endpoints sécurisés pour toutes les opérations

## ⚡ Installation rapide

### Prérequis
- Node.js 20 (voir `engines` dans package.json)
- MySQL 8+ ou MariaDB 10.5+
- Compte Google Developer (optionnel, pour OAuth Google)

### 1. Cloner le projet
```bash
git clone https://github.com/romaric-ui/Online-Report-System.git
cd Online-Report-System
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de la base de données

Le script crée automatiquement la base, les tables et les rôles par défaut :

```bash
# Crée la base "onlinereports" + toutes les tables + rôles
node scripts/init-database.js

# Créer le compte administrateur (admin@sgtec.com / Admin@123)
node scripts/create-admin.js
```

> 💡 Le schéma SQL complet se trouve dans `database/schema.sql` si vous préférez l'exécuter manuellement :
> ```bash
> mysql -u root -p < database/schema.sql
> ```

### 4. Configuration des variables d'environnement

Copiez le template puis éditez-le avec vos valeurs :

```bash
cp env.template .env.local
```

Variables minimales pour le développement local :

```env
# MySQL local
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
```

> 📝 Voir `env.template` pour la liste complète des variables disponibles.

### 5. Configuration Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un existant
3. Activer l'API "Google+ API" et "Google OAuth2 API"
4. Créer des identifiants OAuth 2.0 :
   - Type d'application : Application Web
   - URIs de redirection autorisés : `http://localhost:3000/api/auth/callback/google`
5. Copier le Client ID et Client Secret dans votre `.env.local`

### 6. Lancement de l'application
```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:3000**

## 🗄️ Structure de la base de données

> 📄 Schéma complet : [`database/schema.sql`](database/schema.sql)

### Tables principales

| Table | Description |
|-------|-------------|
| `Role` | Rôles (Administrateur, Utilisateur) |
| `Utilisateur` | Comptes utilisateurs (credentials + Google OAuth) |
| `Rapport` | Rapports de chantier |
| `DonneesFormulaire` | Champs dynamiques des rapports (clé-valeur) |
| `ImageCouverture` | Images de couverture des rapports |
| `HistoriqueTelechargement` | Historique des téléchargements PDF |
| `Message` | Messages de contact / support |
| `Notification` | Notifications système |

### Relations
```
Role (1) ──── (N) Utilisateur (1) ──── (N) Rapport (1) ──── (N) DonneesFormulaire
                                        │                └──── (N) ImageCouverture
                                        └──── (N) HistoriqueTelechargement
```

## 🎯 Utilisation

### Première connexion
1. Accédez à http://localhost:3000
2. Cliquez sur "Se connecter"
3. Choisissez entre :
   - **Connexion Google** (recommandé)
   - **Créer un compte local**

### Créer un rapport de chantier
1. Une fois connecté, cliquez sur "Nouveau rapport".
2. Remplissez les sections :
   - Informations chantier (client, localisation, date, numéro de chantier, etc.)
   - Équipe et matériel présents sur site
   - Suivi d'avancement et observations
   - Incidents / non-conformités et actions correctives
   - Autres points et remarques
3. Ajoutez des photos du chantier si nécessaire.
4. Générez le PDF professionnel pour partage ou archivage.

### Administration
- Les comptes admin peuvent accéder à `/admin/users`
- Gestion des utilisateurs et statistiques
- Surveillance des rapports créés

## 🔧 Scripts utiles

```bash
# Initialiser la base de données (crée les tables + rôles)
node scripts/init-database.js

# Créer le compte administrateur
node scripts/create-admin.js

# Build pour production
npm run build
npm start
```

## 📁 Structure du projet

```
├── src/
│   ├── app/
│   │   ├── admin/           # Dashboard administrateur
│   │   ├── api/             # Routes API
│   │   │   ├── auth/        # Authentification NextAuth
│   │   │   ├── reports/     # Gestion des rapports
│   │   │   └── uploads/     # Upload de fichiers
│   │   └── components/      # Composants React
│   └── middleware.js        # Middleware de sécurité
├── lib/
│   ├── database.js          # Connexion MySQL
│   ├── security.js          # Fonctions de sécurité
│   └── error-handler.js     # Gestion d'erreurs
├── scripts/                 # Scripts d'initialisation
└── database/               # Scripts SQL
```

## 🔒 Sécurité

- **Validation des données** - Tous les inputs sont validés et nettoyés
- **Protection CSRF** - Tokens CSRF pour les requêtes sensibles
- **Hachage des mots de passe** - bcryptjs avec salt
- **Sessions sécurisées** - NextAuth.js avec JWT
- **Protection XSS** - Sanitisation des entrées utilisateur
- **Injection SQL** - Requêtes préparées uniquement

## 🌐 Déploiement

### Variables d'environnement en production
```env
# Remplacer par vos valeurs de production
NEXTAUTH_URL=https://votre-domaine.com
GOOGLE_CLIENT_ID=votre_google_client_id_prod
DB_HOST=votre_serveur_mysql
# ... autres variables
```

### Build de production
```bash
npm run build
npm start
```

## 📚 Technologies utilisées

- **Frontend** : Next.js 15, React, Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : MySQL/MariaDB
- **Authentification** : NextAuth.js, Google OAuth 2.0
- **Sécurité** : bcryptjs, validation/sanitisation
- **PDF** : jsPDF, jsPDF-AutoTable
- **Upload** : Next.js File API

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 🐛 Résolution de problèmes

### Erreur de connexion à la base de données
```bash
# Vérifiez que MySQL est démarré
sudo service mysql start

# Testez la connexion
mysql -u root -p -e "SELECT 1;"
```

### Erreur Google OAuth
- Vérifiez que les URIs de redirection sont correctes dans Google Cloud Console
- Assurez-vous que `NEXTAUTH_URL` correspond à votre domaine

### Serveur ne démarre pas
```bash
# Arrêter tous les processus Node.js
taskkill /F /IM node.exe  # Windows
# ou
pkill node  # Linux/Mac

# Nettoyer et redémarrer
rm -rf .next
npm run dev
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Romaric Adekou**
- GitHub: [@romaric-ui](https://github.com/romaric-ui)
- Projet: [Online-Report-System](https://github.com/romaric-ui/Online-Report-System)

---

⭐ **N'hésitez pas à donner une étoile au projet si vous le trouvez utile !**