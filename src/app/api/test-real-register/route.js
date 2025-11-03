// Test d'inscription réelle en reproduisant la logique de l'API
export async function GET() {
  try {
    console.log('🧪 Test d\'inscription avec la logique officielle...');
    
    // Reproduire exactement la logique de /api/auth/register
    const testData = {
      nom: 'TestUser',
      prenom: 'API', 
      email: `test.api.${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };
    
    console.log('📝 Test avec:', { email: testData.email, nom: testData.nom });
    
    // Importer la fonction de validation
    const { 
      validateEmail, 
      validatePassword, 
      validateName, 
      validateRequestBody
    } = await import('../../../../lib/security.js');
    
    // Validation du body
    const bodyValidation = validateRequestBody(testData, ['nom', 'prenom', 'email', 'password']);
    if (!bodyValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Validation body: ' + bodyValidation.error
      }, { status: 400 });
    }
    
    // Validations individuelles
    const emailValidation = validateEmail(testData.email);
    if (!emailValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Validation email: ' + emailValidation.error
      }, { status: 400 });
    }
    
    const passwordValidation = validatePassword(testData.password);
    if (!passwordValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Validation password: ' + passwordValidation.error
      }, { status: 400 });
    }
    
    const nomValidation = validateName(testData.nom, 'Nom');
    if (!nomValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Validation nom: ' + nomValidation.error
      }, { status: 400 });
    }
    
    const prenomValidation = validateName(testData.prenom, 'Prénom');
    if (!prenomValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Validation prénom: ' + prenomValidation.error
      }, { status: 400 });
    }
    
    console.log('✅ Toutes les validations passées');
    
    // Test de connexion DB
    const { connectDB } = await import('../../../../lib/database.js');
    const db = await connectDB();
    console.log('✅ Connexion DB réussie');
    
    // Valeurs nettoyées
    const cleanEmail = emailValidation.value;
    const cleanNom = nomValidation.value;
    const cleanPrenom = prenomValidation.value;
    const cleanPassword = passwordValidation.value;
    
    // Vérifier si l'utilisateur existe
    const [existingUser] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ? LIMIT 1',
      [cleanEmail]
    );
    
    if (existingUser.length > 0) {
      return Response.json({
        success: false,
        error: 'Un compte avec cet email existe déjà'
      }, { status: 409 });
    }
    
    console.log('✅ Email disponible');
    
    // Hasher le mot de passe
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(cleanPassword, 12);
    console.log('✅ Mot de passe hashé');
    
    // Créer l'utilisateur
    const [result] = await db.execute(
      `INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role) 
       VALUES (?, ?, ?, ?, ?)`,
      [cleanNom, cleanPrenom, cleanEmail, hashedPassword, 2]
    );
    
    console.log('✅ Utilisateur créé avec ID:', result.insertId);
    
    return Response.json({
      success: true,
      message: '🎉 Test d\'inscription réussi via logique officielle !',
      userId: result.insertId,
      testData: {
        email: cleanEmail,
        nom: cleanNom,
        prenom: cleanPrenom
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur test inscription:', error);
    
    return Response.json({
      success: false,
      message: '❌ Erreur lors du test d\'inscription',
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}