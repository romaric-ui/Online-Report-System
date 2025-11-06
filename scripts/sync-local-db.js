// Script pour synchroniser la base locale avec Aiven
const mysql = require('mysql2/promise');

async function syncLocalDatabase() {
  let connection;
  
  try {
    // Connexion à la base locale
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '', // Changez si vous avez un mot de passe
      database: 'onlinereports'
    });

    console.log('✅ Connecté à la base locale');

    // =====================================================
    // 1. SYNCHRONISER LA TABLE ROLE
    // =====================================================
    const [roleColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'onlinereports' 
        AND TABLE_NAME = 'Role'
    `);

    const roleColumnNames = roleColumns.map(c => c.COLUMN_NAME);
    console.log('\n📋 Table Role - Colonnes actuelles:', roleColumnNames.join(', '));

    if (roleColumnNames.includes('libelle') && !roleColumnNames.includes('nom_role')) {
      console.log('🔄 Renommage de "libelle" en "nom_role"...');
      
      await connection.execute(`
        ALTER TABLE Role 
        CHANGE COLUMN libelle nom_role VARCHAR(50) NOT NULL
      `);
      
      console.log('✅ Colonne renommée avec succès !');
    } else if (roleColumnNames.includes('nom_role')) {
      console.log('✅ La colonne "nom_role" existe déjà !');
    }

    // =====================================================
    // 2. SYNCHRONISER LA TABLE UTILISATEUR
    // =====================================================
    const [userColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'onlinereports' 
        AND TABLE_NAME = 'Utilisateur'
    `);

    const userColumnNames = userColumns.map(c => c.COLUMN_NAME);
    console.log('\n📋 Table Utilisateur - Colonnes actuelles:', userColumnNames.join(', '));

    // Ajouter provider_id si absent
    if (!userColumnNames.includes('provider_id')) {
      console.log('➕ Ajout de la colonne "provider_id"...');
      await connection.execute(`
        ALTER TABLE Utilisateur 
        ADD COLUMN provider_id VARCHAR(255) NULL AFTER mot_de_passe
      `);
      console.log('✅ Colonne "provider_id" ajoutée !');
    } else {
      console.log('✅ La colonne "provider_id" existe déjà !');
    }

    // Ajouter provider si absent
    if (!userColumnNames.includes('provider')) {
      console.log('➕ Ajout de la colonne "provider"...');
      await connection.execute(`
        ALTER TABLE Utilisateur 
        ADD COLUMN provider VARCHAR(50) NULL AFTER provider_id
      `);
      console.log('✅ Colonne "provider" ajoutée !');
    } else {
      console.log('✅ La colonne "provider" existe déjà !');
    }

    // Ajouter image si absent
    if (!userColumnNames.includes('image')) {
      console.log('➕ Ajout de la colonne "image"...');
      await connection.execute(`
        ALTER TABLE Utilisateur 
        ADD COLUMN image VARCHAR(500) NULL AFTER provider
      `);
      console.log('✅ Colonne "image" ajoutée !');
    } else {
      console.log('✅ La colonne "image" existe déjà !');
    }

    // Ajouter email_verified si absent
    if (!userColumnNames.includes('email_verified')) {
      console.log('➕ Ajout de la colonne "email_verified"...');
      await connection.execute(`
        ALTER TABLE Utilisateur 
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER image
      `);
      console.log('✅ Colonne "email_verified" ajoutée !');
    } else {
      console.log('✅ La colonne "email_verified" existe déjà !');
    }

    // Afficher les structures finales
    console.log('\n📊 Structure finale de la table Role:');
    const [roleStructure] = await connection.execute('DESCRIBE Role');
    console.table(roleStructure);

    console.log('\n📊 Structure finale de la table Utilisateur:');
    const [userStructure] = await connection.execute('DESCRIBE Utilisateur');
    console.table(userStructure);

    console.log('\n🎉 Synchronisation terminée ! Toutes les colonnes sont alignées avec Aiven.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

syncLocalDatabase();
