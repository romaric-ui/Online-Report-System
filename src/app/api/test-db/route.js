// Test de connexion à la base de données
import mysql from 'mysql2/promise';

export async function GET() {
  console.log('🔍 Test de connexion à la base de données...');
  
  // Variables d'environnement disponibles
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST ? '✅ Défini' : '❌ Manquant',
    DB_PORT: process.env.DB_PORT ? '✅ Défini' : '❌ Manquant',
    DB_USER: process.env.DB_USER ? '✅ Défini' : '❌ Manquant',
    DB_PASSWORD: process.env.DB_PASSWORD ? '✅ Défini' : '❌ Manquant',
    DB_NAME: process.env.DB_NAME ? '✅ Défini' : '❌ Manquant',
  };

  console.log('📊 Variables d\'environnement:', envVars);

  // Configuration de test pour Aiven (variables d'environnement OBLIGATOIRES)
  const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    },
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000
  };

  console.log(`🎯 Tentative de connexion à: ${dbConfig.host}:${dbConfig.port}`);

  try {
    // Test de connexion directe
    const connection = await mysql.createConnection(dbConfig);
    
    // Test simple
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    
    // Test des tables
    let tables = [];
    try {
      const [tableRows] = await connection.execute('SHOW TABLES');
      tables = tableRows.map(row => Object.values(row)[0]);
    } catch (tableError) {
      console.warn('⚠️ Impossible de lister les tables:', tableError.message);
    }

    await connection.end();

    return Response.json({
      success: true,
      message: '✅ Connexion réussie !',
      environment: process.env.NODE_ENV || 'development',
      envVars,
      connection: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
      },
      testQuery: rows[0],
      tables: tables.length > 0 ? tables : 'Aucune table trouvée ou pas de permissions'
    });

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);

    return Response.json({
      success: false,
      error: error.message,
      code: error.code,
      errno: error.errno,
      environment: process.env.NODE_ENV || 'development',
      envVars,
      connection: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
      },
      suggestions: [
        'Vérifiez que les variables d\'environnement sont définies dans Netlify',
        'Vérifiez les informations de connexion Aiven',
        'Vérifiez que le service Aiven est actif',
        'Vérifiez les paramètres SSL'
      ]
    }, { status: 500 });
  }
}