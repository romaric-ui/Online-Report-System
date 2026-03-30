// API pour réinitialiser le mot de passe avec le code
import bcrypt from 'bcryptjs';
import { connectDB } from '../../../../../lib/database.js';
import { validatePassword } from '../../../../../lib/security.js';

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();
    
    // Validations de base
    if (!email || !code || !newPassword) {
      return Response.json({
        success: false,
        error: 'Email, code et nouveau mot de passe requis'
      }, { status: 400 });
    }
    
    // Valider le nouveau mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors
      }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Vérifier le code
    const [resetRequests] = await db.execute(
      `SELECT pr.id, pr.id_utilisateur, pr.expires_at, pr.used, u.email
       FROM PasswordReset pr
       INNER JOIN utilisateur u ON pr.id_utilisateur = u.id_utilisateur
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
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Mettre à jour le mot de passe de l'utilisateur
    await db.execute(
      'UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?',
      [hashedPassword, resetRequest.id_utilisateur]
    );
    
    // Marquer le token comme utilisé
    await db.execute(
      'UPDATE PasswordReset SET used = TRUE WHERE id = ?',
      [resetRequest.id]
    );
    
    // Supprimer tous les autres tokens pour cet utilisateur
    await db.execute(
      'DELETE FROM PasswordReset WHERE id_utilisateur = ? AND id != ?',
      [resetRequest.id_utilisateur, resetRequest.id]
    );
    
    return Response.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
      email: resetRequest.email
    });
    
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error.message);
    
    return Response.json({
      success: false,
      error: 'Erreur lors de la réinitialisation du mot de passe'
    }, { status: 500 });
  }
}