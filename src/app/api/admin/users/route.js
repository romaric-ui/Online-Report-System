import mysql from 'mysql2/promise';

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.AIVEN_DATABASE || 'onlinereports'
};

export async function GET() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Récupérer tous les utilisateurs avec leurs informations de base
    const [users] = await connection.execute(`
      SELECT 
        id, 
        nom, 
        prenom, 
        email, 
        google_id,
        date_creation,
        derniere_connexion
      FROM utilisateur 
      ORDER BY date_creation DESC
    `);

    // Statistiques
    const totalUsers = users.length;
    const googleUsers = users.filter(u => u.google_id).length;
    const localUsers = users.filter(u => !u.google_id).length;

    console.log('📊 Statistiques utilisateurs:', {
      total: totalUsers,
      google: googleUsers,
      local: localUsers
    });

    return Response.json(users);
    
  } catch (error) {
    console.error('❌ Erreur API admin/users:', error);
    return Response.json(
      { error: 'Erreur lors du chargement des utilisateurs' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}