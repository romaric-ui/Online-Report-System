CREATE TABLE IF NOT EXISTS Plan (
  id_plan       INT PRIMARY KEY AUTO_INCREMENT,
  nom           VARCHAR(50) NOT NULL,
  slug          VARCHAR(50) UNIQUE NOT NULL,
  prix_mensuel  DECIMAL(10,2) NOT NULL,
  prix_annuel   DECIMAL(10,2) NOT NULL,
  devise        VARCHAR(3) DEFAULT 'EUR',
  max_utilisateurs INT NOT NULL,
  max_chantiers INT NOT NULL,
  stockage_go   INT NOT NULL,
  fonctionnalites JSON NOT NULL,
  actif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Plan (nom, slug, prix_mensuel, prix_annuel, max_utilisateurs, max_chantiers, stockage_go, fonctionnalites) VALUES
('Essentiel', 'essentiel', 29.00, 290.00, 1, 5, 2, '["chantiers","journal","photos","taches","rapports","documents"]'),
('Pro', 'pro', 79.00, 790.00, 5, 15, 10, '["chantiers","journal","photos","taches","rapports","documents","equipes","pointage","materiel","budget","chat","invitations"]'),
('Enterprise', 'enterprise', 0.00, 0.00, 999, 999, 100, '["chantiers","journal","photos","taches","rapports","documents","equipes","pointage","materiel","budget","chat","invitations","gantt","hse","api","support_prioritaire"]');

CREATE TABLE IF NOT EXISTS Abonnement (
  id_abonnement    INT PRIMARY KEY AUTO_INCREMENT,
  id_entreprise    INT NOT NULL UNIQUE,
  id_plan          INT NOT NULL,
  statut           ENUM('essai','actif','expire','annule','impaye') DEFAULT 'essai',
  date_debut       DATE NOT NULL,
  date_fin         DATE,
  date_essai_fin   DATE,
  periode          ENUM('mensuel','annuel') DEFAULT 'mensuel',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id  VARCHAR(255),
  derniere_facture DATE,
  prochaine_facture DATE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_entreprise) REFERENCES Entreprise(id_entreprise),
  FOREIGN KEY (id_plan) REFERENCES Plan(id_plan)
);

CREATE INDEX idx_abonnement_entreprise ON Abonnement(id_entreprise);
CREATE INDEX idx_abonnement_statut ON Abonnement(statut);
CREATE INDEX idx_abonnement_stripe ON Abonnement(stripe_subscription_id);

-- Donner l'essai gratuit Pro de 7 jours à toutes les entreprises existantes
INSERT INTO Abonnement (id_entreprise, id_plan, statut, date_debut, date_essai_fin)
SELECT id_entreprise, 2, 'essai', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY)
FROM Entreprise
WHERE id_entreprise NOT IN (SELECT id_entreprise FROM Abonnement);
