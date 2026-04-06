-- Sprint 9D — Communication / Chat interne par chantier

CREATE TABLE IF NOT EXISTS Conversation (
  id_conversation INT PRIMARY KEY AUTO_INCREMENT,
  id_chantier     INT NOT NULL,
  titre           VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chantier) REFERENCES Chantier(id_chantier) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ChatMessage (
  id_message       INT PRIMARY KEY AUTO_INCREMENT,
  id_conversation  INT NOT NULL,
  id_utilisateur   INT NOT NULL,
  contenu          TEXT NOT NULL,
  type_message     ENUM('texte','photo','document') DEFAULT 'texte',
  fichier_url      VARCHAR(500),
  lu               BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_conversation) REFERENCES Conversation(id_conversation) ON DELETE CASCADE,
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
);

CREATE INDEX idx_conversation_chantier ON Conversation(id_chantier);
CREATE INDEX idx_message_conversation ON ChatMessage(id_conversation);
CREATE INDEX idx_message_date ON ChatMessage(created_at);

-- Créer automatiquement une conversation par chantier existant
INSERT INTO Conversation (id_chantier, titre)
SELECT id_chantier, CONCAT('Discussion - ', nom) FROM Chantier
WHERE id_chantier NOT IN (SELECT id_chantier FROM Conversation);
