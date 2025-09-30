import mysql from 'mysql2/promise';

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'onlinereports'
};

export async function GET() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Vérifier la structure de la table utilisateur
    const [columns] = await connection.execute('DESCRIBE utilisateur');
    
    // Vérifier si les colonnes Google OAuth existent
    const columnNames = columns.map(col => col.Field);
    const hasGoogleId = columnNames.includes('google_id');
    const hasDateCreation = columnNames.includes('date_creation');
    const hasDerniereConnexion = columnNames.includes('derniere_connexion');
    
    console.log('📋 Structure table utilisateur:', columnNames);
    
    return Response.json({
      success: true,
      columns: columnNames,
      googleOAuthReady: hasGoogleId && hasDateCreation && hasDerniereConnexion,
      missingColumns: [
        !hasGoogleId && 'google_id',
        !hasDateCreation && 'date_creation', 
        !hasDerniereConnexion && 'derniere_connexion'
      ].filter(Boolean),
      message: hasGoogleId && hasDateCreation && hasDerniereConnexion 
        ? 'Base de données prête pour Google OAuth' 
        : 'Colonnes manquantes pour Google OAuth'
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification DB:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Erreur lors de la vérification de la base de données',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}