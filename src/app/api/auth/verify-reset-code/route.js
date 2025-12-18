// API pour vérifier le code de réinitialisation sans changer le mot de passe
import { connectDB } from '../../../../../lib/database.js';

export async function POST(request) {
  try {
    const { email, code } = await request.json();
    
    // Validations de base
    if (!email || !code) {
      return Response.json({
        success: false,
        error: 'Email et code requis'
      }, { status: 400 });
    }
    
    if (code.length !== 6) {
      return Response.json({
        success: false,
        error: 'Le code doit contenir 6 chiffres'
      }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Vérifier le code
    const [resetRequests] = await db.execute(
      `SELECT pr.id, pr.id_utilisateur, pr.expires_at, pr.used
       FROM PasswordReset pr
       WHERE pr.code = ? AND pr.email = ? AND pr.used = FALSE
       LIMIT 1`,
      [code, email]
    );
    
    if (resetRequests.length === 0) {
      return Response.json({
        success: false,
        error: 'Code invalide ou déjà utilisé'
      }, { status: 400 });
    }
    
    const resetRequest = resetRequests[0];
    
    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(resetRequest.expires_at);
    
    if (now > expiresAt) {
      return Response.json({
        success: false,
        error: 'Le code de réinitialisation a expiré. Veuillez en demander un nouveau.'
      }, { status: 400 });
    }
    
    // Code valide !
    return Response.json({
      success: true,
      message: 'Code valide ! Vous pouvez maintenant créer un nouveau mot de passe.'
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
