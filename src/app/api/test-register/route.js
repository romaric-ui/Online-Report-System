// Test complet d'inscription
export async function POST(request) {
  console.log('🧪 Test d\'inscription complet...');
  
  try {
    const { nom, prenom, email, mot_de_passe } = await request.json();
    
    // Validation des données
    if (!nom || !prenom || !email || !mot_de_passe) {
      return Response.json({
        success: false,
        error: 'Tous les champs sont requis'
      }, { status: 400 });
    }
    
    const { connectDB } = await import('../../../../lib/database.js');
    const db = await connectDB();
    
    console.log('✅ Connexion DB réussie');
    
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
    
    console.log('✅ Email disponible');
    
    // Hasher le mot de passe
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);
    
    console.log('✅ Mot de passe hashé');
    
    // Insérer le nouvel utilisateur
    const [result] = await db.execute(`
      INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role, provider) 
      VALUES (?, ?, ?, ?, 2, 'credentials')
    `, [nom, prenom, email, hashedPassword]);
    
    console.log('✅ Utilisateur créé avec ID:', result.insertId);
    
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
    console.error('❌ Erreur inscription:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Test GET pour vérifier que l'endpoint fonctionne
export async function GET() {
  return Response.json({
    success: true,
    message: '✅ Endpoint de test d\'inscription opérationnel',
    instructions: 'Utilisez POST avec { nom, prenom, email, mot_de_passe }',
    timestamp: new Date().toISOString()
  });
}