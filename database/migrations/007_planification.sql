ALTER TABLE Tache ADD COLUMN duree_jours INT;
ALTER TABLE Tache ADD COLUMN date_fin_reelle DATE;
ALTER TABLE Tache ADD COLUMN est_critique BOOLEAN DEFAULT FALSE;
ALTER TABLE Tache ADD COLUMN marge_jours INT DEFAULT 0;
ALTER TABLE Tache ADD COLUMN couleur VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE Tache ADD COLUMN parent_id INT;
ALTER TABLE Tache ADD FOREIGN KEY (parent_id) REFERENCES Tache(id_tache) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS DependanceTache (
  id_dependance    INT PRIMARY KEY AUTO_INCREMENT,
  id_predecesseur  INT NOT NULL,
  id_successeur    INT NOT NULL,
  type_lien        ENUM('FS','FF','SS','SF') DEFAULT 'FS',
  delai_jours      INT DEFAULT 0,
  FOREIGN KEY (id_predecesseur) REFERENCES Tache(id_tache) ON DELETE CASCADE,
  FOREIGN KEY (id_successeur) REFERENCES Tache(id_tache) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Jalon (
  id_jalon      INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier   INT NOT NULL,
  nom           VARCHAR(255) NOT NULL,
  date_prevue   DATE NOT NULL,
  date_reelle   DATE,
  statut        ENUM('a_venir','atteint','en_retard') DEFAULT 'a_venir',
  description   TEXT,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE
);

CREATE INDEX idx_dependance_pred ON DependanceTache(id_predecesseur);
CREATE INDEX idx_dependance_succ ON DependanceTache(id_successeur);
CREATE INDEX idx_jalon_chantier ON Jalon(id_chantier);
