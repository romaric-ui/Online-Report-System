import mysql from 'mysql2/promise';

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'onlinereports', // Forcer la base de données locale
  port: 3306
};

// GET - Récupérer tous les utilisateurs
export async function GET() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Récupérer tous les utilisateurs avec leurs informations de base
    const [users] = await connection.execute(`
      SELECT 
        id_utilisateur as id, 
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
    console.error('❌ Erreur API admin/users GET:', error);
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

// PUT - Modifier un utilisateur
export async function PUT(request) {
  let connection;
  
  try {
    const { id, nom, prenom, email } = await request.json();
    
    if (!id) {
      return Response.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);
    
    // Construire la requête de mise à jour
    const updates = [];
    const values = [];
    
    if (nom !== undefined) {
      updates.push('nom = ?');
      values.push(nom);
    }
    if (prenom !== undefined) {
      updates.push('prenom = ?');
      values.push(prenom);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (updates.length === 0) {
      return Response.json(
        { error: 'Aucune donnée à modifier' },
        { status: 400 }
      );
    }
    
    values.push(id);
    
    await connection.execute(
      `UPDATE utilisateur SET ${updates.join(', ')} WHERE id_utilisateur = ?`,
      values
    );

    console.log('✅ Utilisateur modifié:', id);

    return Response.json({ 
      success: true,
      message: 'Utilisateur modifié avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur API admin/users PUT:', error);
    return Response.json(
      { error: 'Erreur lors de la modification de l\'utilisateur' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si l'utilisateur existe
    const [users] = await connection.execute(
      'SELECT id_utilisateur FROM utilisateur WHERE id_utilisateur = ?',
      [id]
    );
    
    if (users.length === 0) {
      return Response.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Supprimer l'utilisateur
    await connection.execute(
      'DELETE FROM utilisateur WHERE id_utilisateur = ?',
      [id]
    );

    console.log('🗑️ Utilisateur supprimé:', id);

    return Response.json({ 
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur API admin/users DELETE:', error);
    return Response.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}