-- Sprint 9E — Invitations & Rôles entreprise

CREATE TABLE IF NOT EXISTS RoleEntreprise (
  id_role_entreprise INT PRIMARY KEY AUTO_INCREMENT,
  nom                VARCHAR(50) NOT NULL UNIQUE,
  description        VARCHAR(255),
  permissions        JSON NOT NULL
);

INSERT INTO RoleEntreprise (nom, description, permissions) VALUES
('admin', 'Administrateur - accès complet', '["tout"]'),
('chef_chantier', 'Chef de chantier - gère ses chantiers assignés', '["chantiers_assignes","journal","photos","taches","pointage","chat","documents","equipe"]'),
('conducteur_travaux', 'Conducteur de travaux - vue globale lecture', '["chantiers_lecture","rapports","budget_lecture","documents_lecture"]'),
('ouvrier', 'Ouvrier - accès minimal', '["pointage","chat"]');

ALTER TABLE Utilisateur ADD COLUMN id_role_entreprise INT AFTER id_entreprise;
ALTER TABLE Utilisateur ADD FOREIGN KEY (id_role_entreprise) REFERENCES RoleEntreprise(id_role_entreprise);

-- Les admins existants reçoivent le rôle admin
UPDATE Utilisateur SET id_role_entreprise = 1 WHERE id_role = 1;
-- Les autres reçoivent le rôle ouvrier par défaut
UPDATE Utilisateur SET id_role_entreprise = 4 WHERE id_role_entreprise IS NULL;

CREATE TABLE IF NOT EXISTS InvitationEntreprise (
  id_invitation   INT PRIMARY KEY AUTO_INCREMENT,
  id_entreprise   INT NOT NULL,
  email           VARCHAR(255) NOT NULL,
  role_attribue   INT NOT NULL,
  code_invitation VARCHAR(100) UNIQUE NOT NULL,
  invite_par      INT NOT NULL,
  statut          ENUM('en_attente','acceptee','expiree','annulee') DEFAULT 'en_attente',
  date_expiration DATETIME NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise),
  FOREIGN KEY (role_attribue) REFERENCES RoleEntreprise(id_role_entreprise),
  FOREIGN KEY (invite_par) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_invitation_code ON InvitationEntreprise(code_invitation);
CREATE INDEX idx_invitation_email ON InvitationEntreprise(email);
CREATE INDEX idx_invitation_entreprise ON InvitationEntreprise(id_entreprise);
