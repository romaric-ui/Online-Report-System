const mysql = require('mysql2/promise');
const path = require('path');

// Force le chargement du .env.local depuis le bon répertoire
const envPath = path.join(__dirname, '..', '.env.local');
console.log('🔍 Chemin du fichier .env:', envPath);

require('dotenv').config({ path: envPath });

console.log('🔧 Variables d\'environnement chargées:');
console.log('DB_HOST:', process.env.DB_HOST || 'MANQUANT');
console.log('DB_USER:', process.env.DB_USER || 'MANQUANT');
console.log('DB_NAME:', process.env.DB_NAME || 'MANQUANT');
console.log('DB_PORT:', process.env.DB_PORT || 'MANQUANT');
console.log('DB_SSL:', process.env.DB_SSL || 'MANQUANT');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: { rejectUnauthorized: false }
    });

    console.log('✅ Connexion à Aiven réussie');

    // Test simple
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test de requête réussie:', result);

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testConnection();