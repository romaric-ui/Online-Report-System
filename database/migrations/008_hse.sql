CREATE TABLE IF NOT EXISTS ChecklistSecurite (
  id_checklist   INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier    INT NOT NULL,
  date_checklist DATE NOT NULL,
  type_checklist ENUM('quotidienne','ouverture','specifique','audit') NOT NULL,
  remplie_par    INT NOT NULL,
  score          DECIMAL(5,2),
  statut         ENUM('en_cours','complete','non_conforme') DEFAULT 'en_cours',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (remplie_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS ItemChecklist (
  id_item         INT PRIMARY KEY AUTO_INCREMENT,
  id_checklist    INT NOT NULL,
  question        TEXT NOT NULL,
  categorie       VARCHAR(100),
  reponse         ENUM('conforme','non_conforme','non_applicable') DEFAULT 'non_applicable',
  commentaire     TEXT,
  photo_url       VARCHAR(500),
  action_corrective TEXT,
  FOREIGN KEY (id_checklist) REFERENCES ChecklistSecurite(id_checklist) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS IncidentSecurite (
  id_incident     INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier     INT NOT NULL,
  type_incident   ENUM('accident','presqu_accident','situation_dangereuse') NOT NULL,
  gravite         ENUM('benin','moyen','grave','tres_grave') NOT NULL,
  date_incident   DATETIME NOT NULL,
  lieu            TEXT,
  description     TEXT NOT NULL,
  victimes        TEXT,
  temoins         TEXT,
  causes          TEXT,
  mesures_immediates TEXT,
  actions_correctives TEXT,
  jours_arret     INT DEFAULT 0,
  declare_par     INT NOT NULL,
  statut          ENUM('declare','en_enquete','clos') DEFAULT 'declare',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (declare_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_checklist_chantier ON ChecklistSecurite(id_chantier);
CREATE INDEX idx_incident_chantier ON IncidentSecurite(id_chantier);
CREATE INDEX idx_item_checklist ON ItemChecklist(id_checklist);
