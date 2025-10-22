# 📊 Online Report System (SGTEC)

Application Next.js moderne avec système d'authentification complet permettant la création, gestion et génération de rapports professionnels au format PDF.

## 🚀 Fonctionnalités principales

### 🔐 Authentification & Sécurité
- ✅ **Google OAuth 2.0** - Connexion rapide avec votre compte Google
- ✅ **Authentification locale** - Système de connexion classique avec email/mot de passe
- ✅ **NextAuth.js** - Gestion sécurisée des sessions
- ✅ **Sécurité avancée** - Validation, sanitisation, protection CSRF
- ✅ **Middleware de sécurité** - Protection des routes sensibles

### 📝 Gestion des rapports
- ✅ **CRUD complet** - Créer, lire, modifier, supprimer des rapports
- ✅ **Upload d'images** - Images de couverture avec redimensionnement automatique
- ✅ **Tableaux structurés** - Investigation et autres points avec photos
- ✅ **Génération PDF professionnelle** - Avec jsPDF + autotable
- ✅ **Pagination avancée** - Page de garde non numérotée
- ✅ **Filtrage intelligent** - Seules les données pertinentes sont incluses

### 👥 Administration
- ✅ **Dashboard admin** - Gestion des utilisateurs et rapports
- ✅ **Statistiques** - Vue d'ensemble des comptes et activités
- ✅ **API robuste** - Endpoints sécurisés pour toutes les opérations

## ⚡ Installation rapide

### Prérequis
- Node.js 18+ 
- MySQL/MariaDB
- Compte Google Developer (pour OAuth)

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

#### Créer la base de données MySQL
```sql
CREATE DATABASE onlinereports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Exécuter les scripts d'initialisation
```bash
# Initialiser les tables
node scripts/init-database.js

# Créer les rôles admin (optionnel)
node scripts/init-roles.js
```

### 4. Configuration des variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# Configuration MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=onlinereports
DB_PORT=3306

# Clé secrète pour JWT
JWT_SECRET=votre_cle_secrete_tres_longue_et_aleatoire

# Configuration NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_nextauth_aleatoire

# Configuration Google OAuth (voir section suivante)
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
NEXT_PUBLIC_GOOGLE_OAUTH_CONFIGURED=true
```

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

### Table `utilisateur`
```sql
CREATE TABLE utilisateur (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255), -- Peut être NULL pour les comptes Google
  google_id VARCHAR(255) UNIQUE, -- Pour les comptes Google OAuth
  role ENUM('user', 'admin') DEFAULT 'user',
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion TIMESTAMP NULL
);
```

### Table `rapports`
```sql
CREATE TABLE rapports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  titre VARCHAR(255) NOT NULL,
  contenu JSON NOT NULL,
  image_couverture TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES utilisateur(user_id) ON DELETE CASCADE
);
```

## 🎯 Utilisation

### Première connexion
1. Accédez à http://localhost:3000
2. Cliquez sur "Se connecter"
3. Choisissez entre :
   - **Connexion Google** (recommandé)
   - **Créer un compte local**

### Créer un rapport
1. Une fois connecté, cliquez sur "Nouveau rapport"
2. Remplissez les sections :
   - Informations générales
   - Équipe et matériel
   - Tableaux d'investigation
   - Autres points
3. Ajoutez des photos si nécessaire
4. Générez le PDF professionnel

### Administration
- Les comptes admin peuvent accéder à `/admin/users`
- Gestion des utilisateurs et statistiques
- Surveillance des rapports créés

## 🔧 Scripts utiles

```bash
# Créer un utilisateur de test
node scripts/create-test-user.js

# Vérifier la sécurité
node security-check.js

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