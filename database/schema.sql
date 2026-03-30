-- ============================================================
-- Online Report System (SGTEC) — Script de création de la base
-- ============================================================
-- Exécuter ce script pour initialiser la base de données :
--   mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS onlinereports
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE onlinereports;

-- ----------------------------------------------------------
-- Table des rôles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Role (
  id_role       INT PRIMARY KEY AUTO_INCREMENT,
  nom_role      VARCHAR(50)  NOT NULL,
  description   VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

-- Rôles par défaut
INSERT IGNORE INTO Role (id_role, nom_role, description) VALUES
  (1, 'Administrateur', 'Accès complet au système'),
  (2, 'Utilisateur',    'Accès standard pour créer et gérer ses rapports');

-- ----------------------------------------------------------
-- Table des utilisateurs
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Utilisateur (
  id_utilisateur    INT PRIMARY KEY AUTO_INCREMENT,
  nom               VARCHAR(100)  NOT NULL,
  prenom            VARCHAR(100)  NOT NULL,
  email             VARCHAR(255)  NOT NULL UNIQUE,
  telephone         VARCHAR(20)   DEFAULT NULL,
  mot_de_passe      VARCHAR(255)  DEFAULT NULL,          -- NULL pour les comptes Google
  provider          VARCHAR(20)   DEFAULT 'credentials', -- 'credentials' ou 'google'
  provider_id       VARCHAR(255)  DEFAULT NULL,          -- Google ID
  id_role           INT           NOT NULL DEFAULT 2,    -- 2 = Utilisateur
  statut            VARCHAR(20)   DEFAULT 'actif',       -- 'actif' ou 'bloque'
  email_verified    TINYINT(1)    DEFAULT 0,
  date_creation     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion TIMESTAMP    NULL DEFAULT NULL,
  FOREIGN KEY (id_role) REFERENCES Role(id_role)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table des rapports
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Rapport (
  id_rapport          INT PRIMARY KEY AUTO_INCREMENT,
  numero_affaire      VARCHAR(100)  DEFAULT NULL,
  numero_rapport      VARCHAR(100)  DEFAULT NULL,
  nom_chantier        VARCHAR(255)  DEFAULT NULL,
  adresse_chantier    VARCHAR(500)  DEFAULT NULL,
  date_visite         DATE          DEFAULT NULL,
  phase               VARCHAR(100)  DEFAULT NULL,
  equipe_presente     JSON          DEFAULT NULL,
  materiel_utilise    JSON          DEFAULT NULL,
  objectifs_limites   TEXT          DEFAULT NULL,
  deroulement         TEXT          DEFAULT NULL,
  investigation       JSON          DEFAULT NULL,
  autres_points       JSON          DEFAULT NULL,
  conclusion          TEXT          DEFAULT NULL,
  photo_couverture    LONGTEXT      DEFAULT NULL,
  statut              VARCHAR(20)   DEFAULT 'en_attente',
  titre               VARCHAR(255)  DEFAULT NULL,
  description         TEXT          DEFAULT NULL,
  fichier_pdf         LONGTEXT      DEFAULT NULL,
  image_couverture    LONGTEXT      DEFAULT NULL,
  image_couverture_type VARCHAR(50) DEFAULT NULL,
  id_utilisateur      INT           NOT NULL,
  commentaire_admin   TEXT          DEFAULT NULL,
  id_validateur       INT           DEFAULT NULL,
  date_validation     TIMESTAMP     NULL DEFAULT NULL,
  date_creation       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  date_modification   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_validateur)  REFERENCES Utilisateur(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table de vérification OTP
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verification (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  user_id         INT           NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  otp_code        VARCHAR(10)   NOT NULL,
  expires_at      DATETIME      NOT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
  INDEX idx_email_otp (email, otp_code),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table de réinitialisation de mot de passe
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS PasswordReset (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur  INT           NOT NULL,
  code            VARCHAR(6)    NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  expires_at      DATETIME      NOT NULL,
  used            TINYINT(1)    DEFAULT 0,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table des données de formulaire (champs dynamiques)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS DonneesFormulaire (
  id_donnee     INT PRIMARY KEY AUTO_INCREMENT,
  champ_nom     VARCHAR(100)  NOT NULL,
  champ_valeur  LONGTEXT      DEFAULT NULL,
  id_rapport    INT           NOT NULL,
  FOREIGN KEY (id_rapport) REFERENCES Rapport(id_rapport) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table des images de couverture
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ImageCouverture (
  id_image        INT PRIMARY KEY AUTO_INCREMENT,
  id_rapport      INT           NOT NULL,
  nom_fichier     VARCHAR(255)  NOT NULL,
  nom_stockage    VARCHAR(255)  NOT NULL,
  chemin_fichier  VARCHAR(500)  NOT NULL,
  type_mime       VARCHAR(50)   NOT NULL,
  taille_fichier  INT           DEFAULT NULL,
  largeur         INT           DEFAULT NULL,
  hauteur         INT           DEFAULT NULL,
  description     VARCHAR(255)  DEFAULT NULL,
  date_upload     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rapport) REFERENCES Rapport(id_rapport) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table de l'historique des téléchargements
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS HistoriqueTelechargement (
  id_telechargement INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur    INT       NOT NULL,
  id_rapport        INT       NOT NULL,
  date_telechargement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_rapport)     REFERENCES Rapport(id_rapport)        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table des messages (contact / support)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Message (
  id_message      INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur  INT           DEFAULT NULL,
  nom             VARCHAR(100)  DEFAULT NULL,
  email           VARCHAR(255)  DEFAULT NULL,
  sujet           VARCHAR(255)  DEFAULT NULL,
  contenu         TEXT          NOT NULL,
  statut          VARCHAR(20)   DEFAULT 'non_lu',  -- 'non_lu', 'lu', 'repondu'
  reponse         TEXT          DEFAULT NULL,
  reponse_admin   TEXT          DEFAULT NULL,
  date_creation   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  date_reponse    TIMESTAMP     NULL DEFAULT NULL,
  date_lecture    TIMESTAMP     NULL DEFAULT NULL,
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Table des notifications
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Notification (
  id_notification    INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur     INT           DEFAULT NULL,
  type_notification  VARCHAR(50)   NOT NULL DEFAULT 'systeme',  -- 'message', 'rapport', 'systeme'
  titre              VARCHAR(255)  NOT NULL,
  contenu            TEXT          DEFAULT NULL,
  lien               VARCHAR(500)  DEFAULT NULL,
  lu                 TINYINT(1)    DEFAULT 0,
  date_creation      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  date_lecture       TIMESTAMP     NULL DEFAULT NULL,
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Fin du script — Base prête à l'emploi
-- ============================================================
