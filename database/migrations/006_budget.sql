CREATE TABLE IF NOT EXISTS BudgetChantier (
  id_budget     INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier   INT NOT NULL UNIQUE,
  budget_total  DECIMAL(15,2) NOT NULL,
  devise        VARCHAR(10) DEFAULT 'XOF',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Depense (
  id_depense     INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier    INT NOT NULL,
  libelle        VARCHAR(255) NOT NULL,
  montant        DECIMAL(15,2) NOT NULL,
  date_depense   DATE NOT NULL,
  categorie      ENUM('materiaux','main_oeuvre','location','sous_traitance','transport','autre') NOT NULL,
  fournisseur    VARCHAR(255),
  justificatif_url VARCHAR(500),
  statut         ENUM('en_attente','validee','rejetee') DEFAULT 'en_attente',
  cree_par       INT,
  valide_par     INT,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE,
  FOREIGN KEY (cree_par) REFERENCES Utilisateur(id_utilisateur),
  FOREIGN KEY (valide_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_depense_chantier ON Depense(id_chantier);
CREATE INDEX idx_depense_categorie ON Depense(categorie);
CREATE INDEX idx_depense_date ON Depense(date_depense);
