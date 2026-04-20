CREATE TABLE IF NOT EXISTS StockSecurite (
  id_stock         INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier      INT NOT NULL,
  nom_article      VARCHAR(255) NOT NULL,
  categorie        ENUM('epi','extincteur','signalisation','premier_secours','protection_collective','autre') NOT NULL,
  quantite         INT NOT NULL DEFAULT 0,
  quantite_min     INT DEFAULT 0,
  unite            VARCHAR(50) DEFAULT 'unité',
  emplacement      VARCHAR(255),
  etat             ENUM('neuf','bon','usage','a_remplacer','hors_service') DEFAULT 'bon',
  date_peremption  DATE,
  date_derniere_verification DATE,
  date_prochaine_verification DATE,
  frequence_verification_jours INT DEFAULT 90,
  responsable      INT,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (responsable) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS VerificationPeriodique (
  id_verification   INT PRIMARY KEY AUTO_INCREMENT,
  id_stock          INT NOT NULL,
  date_verification DATE NOT NULL,
  resultat          ENUM('conforme','non_conforme','a_surveiller') NOT NULL,
  verificateur      INT NOT NULL,
  observations      TEXT,
  actions_correctives TEXT,
  prochaine_verification DATE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_stock) REFERENCES StockSecurite(id_stock) ON DELETE CASCADE,
  FOREIGN KEY (verificateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS MouvementStock (
  id_mouvement     INT PRIMARY KEY AUTO_INCREMENT,
  id_stock         INT NOT NULL,
  type_mouvement   ENUM('entree','sortie','transfert','rebut') NOT NULL,
  quantite         INT NOT NULL,
  motif            VARCHAR(255),
  destination      VARCHAR(255),
  effectue_par     INT NOT NULL,
  date_mouvement   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_stock) REFERENCES StockSecurite(id_stock) ON DELETE CASCADE,
  FOREIGN KEY (effectue_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_stock_chantier ON StockSecurite(id_chantier);
CREATE INDEX idx_stock_categorie ON StockSecurite(categorie);
CREATE INDEX idx_verification_stock ON VerificationPeriodique(id_stock);
CREATE INDEX idx_mouvement_stock ON MouvementStock(id_stock);
