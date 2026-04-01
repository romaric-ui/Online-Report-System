CREATE TABLE IF NOT EXISTS Materiel (
  id_materiel      INT PRIMARY KEY AUTO_INCREMENT,
  id_entreprise    INT NOT NULL,
  nom              VARCHAR(255) NOT NULL,
  categorie        ENUM('outil','engin','echafaudage','protection','mesure','autre') NOT NULL,
  reference        VARCHAR(100),
  numero_serie     VARCHAR(100),
  marque           VARCHAR(100),
  etat             ENUM('neuf','bon','usage','a_reparer','hors_service') DEFAULT 'bon',
  date_achat       DATE,
  prix_achat       DECIMAL(15,2),
  date_prochaine_maintenance DATE,
  localisation     VARCHAR(255),
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise)
);

CREATE TABLE IF NOT EXISTS AffectationMateriel (
  id_affectation   INT PRIMARY KEY AUTO_INCREMENT,
  id_materiel      INT NOT NULL,
  id_chantier      INT NOT NULL,
  date_sortie      DATE NOT NULL,
  date_retour_prevue DATE,
  date_retour      DATE,
  etat_sortie      VARCHAR(20),
  etat_retour      VARCHAR(20),
  sorti_par        INT,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_materiel) REFERENCES Materiel(id_materiel),
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier),
  FOREIGN KEY (sorti_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_materiel_entreprise ON Materiel(id_entreprise);
CREATE INDEX idx_materiel_etat ON Materiel(etat);
CREATE INDEX idx_affectation_materiel ON AffectationMateriel(id_materiel);
CREATE INDEX idx_affectation_materiel_chantier ON AffectationMateriel(id_chantier);
