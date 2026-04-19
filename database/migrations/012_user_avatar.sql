-- Sprint 9F — Photo de profil utilisateur
ALTER TABLE Utilisateur ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) DEFAULT NULL;
