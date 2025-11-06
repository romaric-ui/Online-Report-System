-- Script pour aligner la structure locale avec Aiven
-- À exécuter sur votre MySQL local

USE onlinereports;

-- Vérifier si la colonne libelle existe et la renommer en nom_role
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'onlinereports'
    AND TABLE_NAME = 'Role'
    AND COLUMN_NAME = 'libelle'
);

-- Renommer libelle en nom_role si elle existe
SET @sql = IF(@col_exists > 0,
    'ALTER TABLE Role CHANGE COLUMN libelle nom_role VARCHAR(50) NOT NULL',
    'SELECT "Colonne nom_role déjà présente ou libelle inexistante" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier que la table a bien les bonnes colonnes
DESCRIBE Role;

SELECT '✅ Structure de la table Role mise à jour !' as resultat;
