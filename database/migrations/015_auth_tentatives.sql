-- Compteur d'essais des codes à 6 chiffres (5 essais max, voir lib/auth-codes.js).
-- À exécuter une fois, AVANT de déployer le code qui l'utilise.

-- PasswordReset était créée à la volée par /api/auth/forgot-password :
-- on garantit son existence avant de la modifier.
CREATE TABLE IF NOT EXISTS PasswordReset (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  id_utilisateur  INT           NOT NULL,
  code            VARCHAR(6)    NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  expires_at      DATETIME      NOT NULL,
  used            TINYINT(1)    DEFAULT 0,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

ALTER TABLE otp_verification ADD COLUMN tentatives INT NOT NULL DEFAULT 0;
ALTER TABLE PasswordReset    ADD COLUMN tentatives INT NOT NULL DEFAULT 0;
