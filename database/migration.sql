-- ============================================================
-- Migration SQL — Mise à jour de la base existante
-- À exécuter UNE SEULE FOIS sur une base déjà créée
-- ============================================================

-- 1. Rapport : titre peut être NULL (l'API ne l'envoie pas toujours)
ALTER TABLE Rapport 
  MODIFY COLUMN titre VARCHAR(255) DEFAULT NULL;

-- 2. Rapport : statut par défaut 'en_attente' au lieu de NULL
ALTER TABLE Rapport 
  MODIFY COLUMN statut VARCHAR(20) DEFAULT 'en_attente';

-- 3. Notification : ajouter les colonnes manquantes si la table existe déjà
-- Vérifier et ajouter type_notification
ALTER TABLE Notification 
  ADD COLUMN IF NOT EXISTS type_notification VARCHAR(50) NOT NULL DEFAULT 'systeme' AFTER id_utilisateur;

-- Vérifier et ajouter contenu
ALTER TABLE Notification 
  ADD COLUMN IF NOT EXISTS contenu TEXT DEFAULT NULL AFTER titre;

-- Vérifier et ajouter lien
ALTER TABLE Notification 
  ADD COLUMN IF NOT EXISTS lien VARCHAR(500) DEFAULT NULL AFTER contenu;

-- Vérifier et ajouter date_lecture
ALTER TABLE Notification 
  ADD COLUMN IF NOT EXISTS date_lecture TIMESTAMP NULL DEFAULT NULL AFTER date_creation;

-- 4. S'assurer que la colonne 'lu' existe (certaines anciennes versions)
ALTER TABLE Notification 
  ADD COLUMN IF NOT EXISTS lu TINYINT(1) DEFAULT 0 AFTER lien;

-- 5. Utilisateur : s'assurer que telephone et statut existent
ALTER TABLE Utilisateur 
  ADD COLUMN IF NOT EXISTS telephone VARCHAR(20) DEFAULT NULL AFTER email;

ALTER TABLE Utilisateur 
  ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif' AFTER id_role;

-- ============================================================
-- Vérification : afficher la structure finale
-- ============================================================
DESCRIBE Notification;
DESCRIBE Rapport;
DESCRIBE Utilisateur;
