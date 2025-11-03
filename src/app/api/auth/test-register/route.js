// Test d'inscription simplifié pour diagnostic
import { connectDB } from '../../../../../lib/database.js';

export async function POST(request) {
  console.log('🧪 Test d\'inscription - Diagnostic');
  
  try {
    // Test de récupération du body
    let body;
    try {
      body = await request.json();
      console.log('📝 Body reçu:', { ...body, password: '***' });
    } catch (bodyError) {
      console.error('❌ Erreur parsing body:', bodyError);
      return Response.json({ 
        error: 'Erreur de format des données',
        details: bodyError.message 
      }, { status: 400 });
    }

    // Test de connexion DB
    let db;
    try {
      db = await connectDB();
      console.log('✅ Connexion DB réussie');
    } catch (dbError) {
      console.error('❌ Erreur connexion DB:', dbError);
      return Response.json({ 
        error: 'Erreur de connexion à la base de données',
        details: dbError.message,
        code: dbError.code 
      }, { status: 500 });
    }

    // Test de la structure de la table
    try {
      const [columns] = await db.execute('DESCRIBE Utilisateur');
      console.log('📊 Structure table Utilisateur:', columns.map(c => c.Field));
    } catch (tableError) {
      console.error('❌ Erreur structure table:', tableError);
      return Response.json({ 
        error: 'Table Utilisateur introuvable',
        details: tableError.message 
      }, { status: 500 });
    }

    // Test d'insertion simple
    const testEmail = `test-${Date.now()}@example.com`;
    try {
      const [result] = await db.execute(
        `INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Test', 'User', testEmail, 'hashedpassword', 2]
      );
      
      console.log('✅ Test insertion réussie, ID:', result.insertId);
      
      // Nettoyer le test
      await db.execute('DELETE FROM Utilisateur WHERE email = ?', [testEmail]);
      
      return Response.json({
        success: true,
        message: 'Test d\'inscription réussi',
        testId: result.insertId
      });
      
    } catch (insertError) {
      console.error('❌ Erreur insertion:', insertError);
      return Response.json({ 
        error: 'Erreur lors de l\'insertion en base',
        details: insertError.message,
        code: insertError.code,
        errno: insertError.errno
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return Response.json({ 
      error: 'Erreur système',
      details: error.message 
    }, { status: 500 });
  }
}