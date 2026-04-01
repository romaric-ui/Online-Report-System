CREATE TABLE IF NOT EXISTS Ouvrier (
  id_ouvrier     INT PRIMARY KEY AUTO_INCREMENT,
  id_entreprise  INT NOT NULL,
  nom            VARCHAR(255) NOT NULL,
  prenom         VARCHAR(255) NOT NULL,
  telephone      VARCHAR(20),
  poste          VARCHAR(100),
  specialite     VARCHAR(100),
  taux_horaire   DECIMAL(10,2),
  statut         ENUM('actif','inactif','en_conge') DEFAULT 'actif',
  photo_url      VARCHAR(500),
  date_embauche  DATE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise)
);

CREATE TABLE IF NOT EXISTS AffectationChantier (
  id_affectation INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier    INT NOT NULL,
  id_ouvrier     INT NOT NULL,
  date_debut     DATE NOT NULL,
  date_fin       DATE,
  role_chantier  VARCHAR(100),
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (id_ouvrier) REFERENCES Ouvrier(id_ouvrier) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Pointage (
  id_pointage      INT PRIMARY KEY AUTO_INCREMENT,
  id_ouvrier       INT NOT NULL,
  id_chantier      INT NOT NULL,
  date_pointage    DATE NOT NULL,
  heure_arrivee    TIME,
  heure_depart     TIME,
  heures_travaillees DECIMAL(4,2),
  statut           ENUM('present','absent','retard','conge') DEFAULT 'present',
  note             TEXT,
  pointe_par       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_pointage (id_ouvrier, id_chantier, date_pointage),
  FOREIGN KEY (id_ouvrier) REFERENCES Ouvrier(id_ouvrier),
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier),
  FOREIGN KEY (pointe_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_ouvrier_entreprise ON Ouvrier(id_entreprise);
CREATE INDEX idx_affectation_chantier ON AffectationChantier(id_chantier);
CREATE INDEX idx_pointage_chantier ON Pointage(id_chantier);
CREATE INDEX idx_pointage_date ON Pointage(date_pointage);
