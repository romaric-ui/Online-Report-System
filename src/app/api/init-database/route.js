// Script d'initialisation des tables pour Aiven
import { connectDB } from '../../lib/database.js';

export async function GET() {
  console.log('🚀 Initialisation des tables Aiven...');
  
  try {
    const db = await connectDB();
    
    const results = [];
    
    // 1. Créer la table Role
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS Role (
          id_role INT AUTO_INCREMENT PRIMARY KEY,
          nom_role VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push('✅ Table Role créée');
    } catch (error) {
      results.push(`❌ Erreur Role: ${error.message}`);
    }

    // 2. Insérer les rôles par défaut
    try {
      await db.execute(`
        INSERT IGNORE INTO Role (id_role, nom_role, description) VALUES 
        (1, 'admin', 'Administrateur système'),
        (2, 'user', 'Utilisateur standard')
      `);
      results.push('✅ Rôles par défaut insérés');
    } catch (error) {
      results.push(`❌ Erreur rôles: ${error.message}`);
    }

    // 3. Créer la table Utilisateur
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS Utilisateur (
          id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          prenom VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          mot_de_passe VARCHAR(255),
          id_role INT DEFAULT 2,
          provider VARCHAR(50) DEFAULT 'credentials',
          provider_id VARCHAR(255),
          image VARCHAR(500),
          email_verified BOOLEAN DEFAULT FALSE,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (id_role) REFERENCES Role(id_role) ON DELETE SET NULL,
          INDEX idx_email (email),
          INDEX idx_provider (provider, provider_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push('✅ Table Utilisateur créée');
    } catch (error) {
      results.push(`❌ Erreur Utilisateur: ${error.message}`);
    }

    // 4. Créer la table Rapport
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS Rapport (
          id_rapport INT AUTO_INCREMENT PRIMARY KEY,
          titre VARCHAR(255) NOT NULL,
          description TEXT,
          fichier_pdf LONGTEXT,
          image_couverture LONGTEXT,
          image_couverture_type VARCHAR(100),
          id_utilisateur INT,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
          INDEX idx_utilisateur (id_utilisateur),
          INDEX idx_date_creation (date_creation)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push('✅ Table Rapport créée');
    } catch (error) {
      results.push(`❌ Erreur Rapport: ${error.message}`);
    }

    // 5. Créer la table DonneesFormulaire
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS DonneesFormulaire (
          id_donnee INT AUTO_INCREMENT PRIMARY KEY,
          champ_nom VARCHAR(100) NOT NULL,
          champ_valeur LONGTEXT,
          id_rapport INT NOT NULL,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_rapport) REFERENCES Rapport(id_rapport) ON DELETE CASCADE,
          INDEX idx_rapport_champ (id_rapport, champ_nom)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push('✅ Table DonneesFormulaire créée');
    } catch (error) {
      results.push(`❌ Erreur DonneesFormulaire: ${error.message}`);
    }

    // 6. Créer la table HistoriqueTelechargement
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS HistoriqueTelechargement (
          id_telechargement INT AUTO_INCREMENT PRIMARY KEY,
          id_utilisateur INT,
          id_rapport INT,
          date_telechargement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
          FOREIGN KEY (id_rapport) REFERENCES Rapport(id_rapport) ON DELETE CASCADE,
          INDEX idx_utilisateur_date (id_utilisateur, date_telechargement),
          INDEX idx_rapport_date (id_rapport, date_telechargement)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push('✅ Table HistoriqueTelechargement créée');
    } catch (error) {
      results.push(`❌ Erreur HistoriqueTelechargement: ${error.message}`);
    }

    // Vérifier les tables créées
    const [tables] = await db.execute('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);

    return Response.json({
      success: true,
      message: '🎉 Initialisation des tables terminée !',
      results,
      tablesCreated: tableNames,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    return Response.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}