// API pour vérifier le code de vérification
import { connectDB } from '../../../../lib/database.js';
import { validateEmail } from '../../../../lib/security.js';

export async function POST(request) {
  try {
    const { email, code } = await request.json();
    
    // Validation
    if (!email || !code) {
      return Response.json({
        success: false,
        error: 'Email et code requis'
      }, { status: 400 });
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Format d\'email invalide'
      }, { status: 400 });
    }
    
    const cleanEmail = emailValidation.value;
    const cleanCode = code.toString().trim();
    
    if (cleanCode.length !== 6) {
      return Response.json({
        success: false,
        error: 'Le code doit contenir 6 chiffres'
      }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Vérifier le code
    const [codes] = await db.execute(
      `SELECT * FROM CodeVerification 
       WHERE email = ? AND code = ? AND verified = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, cleanCode]
    );
    
    if (codes.length === 0) {
      return Response.json({
        success: false,
        error: 'Code de vérification invalide'
      }, { status: 400 });
    }
    
    const verification = codes[0];
    
    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    
    if (now > expiresAt) {
      return Response.json({
        success: false,
        error: 'Le code de vérification a expiré. Demandez un nouveau code.'
      }, { status: 400 });
    }
    
    // Marquer le code comme vérifié
    await db.execute(
      'UPDATE CodeVerification SET verified = TRUE WHERE id = ?',
      [verification.id]
    );
    
    return Response.json({
      success: true,
      message: 'Email vérifié avec succès !',
      email: cleanEmail
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification code:', error);
    
    return Response.json({
      success: false,
      error: 'Erreur lors de la vérification du code',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}