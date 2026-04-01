CREATE TABLE IF NOT EXISTS Entreprise (
  id_entreprise INT PRIMARY KEY AUTO_INCREMENT,
  nom           VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  logo_url      VARCHAR(500),
  pays          VARCHAR(100) DEFAULT 'Bénin',
  devise        VARCHAR(10) DEFAULT 'XOF',
  telephone     VARCHAR(20),
  email_contact VARCHAR(255),
  adresse       TEXT,
  actif         BOOLEAN DEFAULT TRUE,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE Utilisateur ADD COLUMN id_entreprise INT AFTER id_utilisateur;
ALTER TABLE Utilisateur ADD FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise);

ALTER TABLE Rapport ADD COLUMN id_entreprise INT AFTER id_rapport;
ALTER TABLE Rapport ADD FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise);

CREATE INDEX idx_user_entreprise ON Utilisateur(id_entreprise);
CREATE INDEX idx_rapport_entreprise ON Rapport(id_entreprise);

-- Entreprise par défaut pour les données existantes
INSERT INTO Entreprise (nom, slug) VALUES ('SGTEC', 'sgtec');
UPDATE Utilisateur SET id_entreprise = 1 WHERE id_entreprise IS NULL;
UPDATE Rapport SET id_entreprise = 1 WHERE id_entreprise IS NULL;
