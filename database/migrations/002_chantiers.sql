CREATE TABLE IF NOT EXISTS Chantier (
  id_chantier      INT PRIMARY KEY AUTO_INCREMENT,
  id_entreprise    INT NOT NULL,
  nom              VARCHAR(255) NOT NULL,
  reference        VARCHAR(50),
  client_nom       VARCHAR(255),
  client_telephone VARCHAR(20),
  client_email     VARCHAR(255),
  adresse          TEXT,
  ville            VARCHAR(100),
  pays             VARCHAR(100),
  latitude         DECIMAL(10,8),
  longitude        DECIMAL(11,8),
  date_debut       DATE,
  date_fin_prevue  DATE,
  date_fin_reelle  DATE,
  statut           ENUM('planifie','en_cours','en_pause','termine','annule') DEFAULT 'planifie',
  progression      DECIMAL(5,2) DEFAULT 0,
  budget_prevu     DECIMAL(15,2),
  image_url        VARCHAR(500),
  description      TEXT,
  created_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise),
  FOREIGN KEY (created_by) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS Lot (
  id_lot        INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier   INT NOT NULL,
  nom           VARCHAR(255) NOT NULL,
  description   TEXT,
  ordre         INT DEFAULT 0,
  progression   DECIMAL(5,2) DEFAULT 0,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS JournalChantier (
  id_journal     INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier    INT NOT NULL,
  date_journal   DATE NOT NULL,
  meteo          VARCHAR(50),
  resume         TEXT,
  travaux_realises TEXT,
  problemes      TEXT,
  decisions      TEXT,
  observations   TEXT,
  redige_par     INT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_journal (id_chantier, date_journal),
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (redige_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS PhotoChantier (
  id_photo      INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier   INT NOT NULL,
  id_journal    INT,
  type_photo    ENUM('avant','pendant','apres','probleme','general') DEFAULT 'general',
  url           VARCHAR(500) NOT NULL,
  legende       TEXT,
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  prise_par     INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (id_journal) REFERENCES JournalChantier(id_journal) ON DELETE SET NULL,
  FOREIGN KEY (prise_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS Tache (
  id_tache       INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier    INT NOT NULL,
  id_lot         INT,
  nom            VARCHAR(255) NOT NULL,
  description    TEXT,
  pourcentage    DECIMAL(5,2) DEFAULT 0,
  date_debut     DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  statut         ENUM('a_faire','en_cours','en_attente','termine') DEFAULT 'a_faire',
  priorite       ENUM('basse','normale','haute','urgente') DEFAULT 'normale',
  assignee_a     INT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (id_lot) REFERENCES Lot(id_lot) ON DELETE SET NULL,
  FOREIGN KEY (assignee_a) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_chantier_entreprise ON Chantier(id_entreprise);
CREATE INDEX idx_chantier_statut ON Chantier(statut);
CREATE INDEX idx_tache_chantier ON Tache(id_chantier);
CREATE INDEX idx_journal_chantier ON JournalChantier(id_chantier);
CREATE INDEX idx_photo_chantier ON PhotoChantier(id_chantier);
