// Script d'initialisation de la base de données
// Usage : node --experimental-modules scripts/init-database.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config locale (les scripts d'init tournent toujours en local)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true, // nécessaire pour exécuter le schema.sql entier
};

const DB_NAME = process.env.DB_NAME || 'onlinereports';

async function initializeDatabase() {
  let connection;

  try {
    console.log('📡 Connexion au serveur MySQL...');
    connection = await mysql.createConnection(dbConfig);

    // 1. Créer la base si elle n'existe pas
    console.log(`🗄️  Création de la base "${DB_NAME}" si nécessaire...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.changeUser({ database: DB_NAME });

    // 2. Exécuter le schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Fichier database/schema.sql introuvable !');
      process.exit(1);
    }

    console.log('📝 Exécution de database/schema.sql...');
    let schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Retirer les instructions CREATE DATABASE / USE (on les gère déjà au-dessus)
    schemaSql = schemaSql
      .replace(/CREATE DATABASE[^;]*;/gi, '')
      .replace(/USE\s+\w+\s*;/gi, '');

    await connection.query(schemaSql);
    console.log('✅ Tables créées avec succès');

    // 3. Vérifier le résultat
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📊 Tables dans "${DB_NAME}" :`);
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`  ✔ ${tableName}`);
    });

    // 4. Vérifier les rôles
    const [roles] = await connection.execute('SELECT * FROM Role');
    console.log(`\n👥 Rôles (${roles.length}) :`);
    roles.forEach(r => console.log(`  - [${r.id_role}] ${r.nom_role}`));

    // 5. Compter les données existantes
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM Utilisateur');
    const [reports] = await connection.execute('SELECT COUNT(*) as count FROM Rapport');
    console.log(`\n📈 Données existantes :`);
    console.log(`  - Utilisateurs : ${users[0].count}`);
    console.log(`  - Rapports     : ${reports[0].count}`);

    console.log('\n🎉 Initialisation terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

initializeDatabase();