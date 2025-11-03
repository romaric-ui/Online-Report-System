// Test complet du processus d'inscription
export async function GET() {
  const results = [];
  
  try {
    // 1. Test de connexion à la base
    results.push('🔍 Test 1: Connexion à la base de données...');
    const { connectDB } = await import('../../../../lib/database.js');
    const db = await connectDB();
    results.push('✅ Connexion DB réussie');
    
    // 2. Test des tables existantes
    results.push('🔍 Test 2: Vérification des tables...');
    const [tables] = await db.execute('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    results.push(`✅ Tables trouvées: ${tableNames.join(', ')}`);
    
    // 3. Test de la structure de la table Utilisateur
    if (tableNames.includes('Utilisateur')) {
      results.push('🔍 Test 3: Structure table Utilisateur...');
      const [structure] = await db.execute('DESCRIBE Utilisateur');
      results.push(`✅ Colonnes: ${structure.map(col => col.Field).join(', ')}`);
    } else {
      results.push('❌ Test 3: Table Utilisateur non trouvée');
    }
    
    // 4. Test d'insertion d'un utilisateur de test
    results.push('🔍 Test 4: Test d\'insertion utilisateur...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      
      const [insertResult] = await db.execute(`
        INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role, provider) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['TestNom', 'TestPrenom', testEmail, hashedPassword, 2, 'credentials']);
      
      results.push(`✅ Utilisateur créé avec ID: ${insertResult.insertId}`);
      
      // 5. Test de récupération
      results.push('🔍 Test 5: Vérification insertion...');
      const [user] = await db.execute('SELECT * FROM Utilisateur WHERE email = ?', [testEmail]);
      
      if (user.length > 0) {
        results.push(`✅ Utilisateur récupéré: ${user[0].nom} ${user[0].prenom}`);
        
        // 6. Nettoyage - supprimer l'utilisateur de test
        await db.execute('DELETE FROM Utilisateur WHERE email = ?', [testEmail]);
        results.push('✅ Utilisateur de test supprimé');
      } else {
        results.push('❌ Utilisateur de test non récupéré');
      }
      
    } catch (insertError) {
      results.push(`❌ Erreur insertion: ${insertError.message}`);
    }
    
    // 7. Test final - nombre d'utilisateurs
    results.push('🔍 Test 6: Comptage utilisateurs...');
    const [count] = await db.execute('SELECT COUNT(*) as total FROM Utilisateur');
    results.push(`✅ Nombre total d'utilisateurs: ${count[0].total}`);
    
    return Response.json({
      success: true,
      message: '🎉 Tests terminés avec succès !',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    results.push(`❌ Erreur générale: ${error.message}`);
    
    return Response.json({
      success: false,
      error: error.message,
      code: error.code,
      results,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Test POST pour inscription réelle
export async function POST(request) {
  try {
    const { nom, prenom, email, password } = await request.json();
    
    // Validation des données
    if (!nom || !prenom || !email || !password) {
      return Response.json({
        success: false,
        error: 'Tous les champs sont requis'
      }, { status: 400 });
    }
    
    const { connectDB } = await import('../../../../lib/database.js');
    const db = await connectDB();
    
    // Vérifier si l'utilisateur existe déjà
    const [existing] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return Response.json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      }, { status: 409 });
    }
    
    // Hasher le mot de passe
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insérer le nouvel utilisateur
    const [result] = await db.execute(`
      INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role, provider) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nom, prenom, email, hashedPassword, 2, 'credentials']);
    
    return Response.json({
      success: true,
      message: '🎉 Compte créé avec succès !',
      user: {
        id: result.insertId,
        nom,
        prenom,
        email,
        role: 'user'
      }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}