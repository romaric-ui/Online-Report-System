CREATE TABLE IF NOT EXISTS DocumentChantier (
  id_document    INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier    INT NOT NULL,
  nom_fichier    VARCHAR(255) NOT NULL,
  nom_original   VARCHAR(255) NOT NULL,
  chemin_fichier VARCHAR(500) NOT NULL,
  type_mime      VARCHAR(100),
  taille_fichier INT,
  categorie      ENUM('plan','contrat','devis','facture','permis','pv_reception','rapport','autre') NOT NULL,
  description    TEXT,
  version        INT DEFAULT 1,
  uploaded_by    INT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_document_chantier ON DocumentChantier(id_chantier);
CREATE INDEX idx_document_categorie ON DocumentChantier(categorie);
