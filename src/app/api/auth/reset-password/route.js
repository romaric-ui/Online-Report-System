// API pour réinitialiser le mot de passe avec le code
import bcrypt from 'bcryptjs';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { checkResetCode } from '../../../../../lib/auth-codes.js';
import { validateEmail, validatePassword, rateLimitCheck, getClientIp } from '../../../../../lib/security.js';
import { SECURITY_CONFIG, SECURITY_MESSAGES } from '../../../../../lib/security-config.js';

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();

    // Validations de base
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid || !code || !newPassword) {
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
        error: passwordValidation.error
      }, { status: 400 });
    }

    const { codeVerify } = SECURITY_CONFIG.rateLimits;
    const ip = getClientIp(request.headers);
    if (!rateLimitCheck(`code-verify-ip:${ip}`, codeVerify.maxAttemptsPerIp, codeVerify.windowMs).allowed) {
      return Response.json({ success: false, error: SECURITY_MESSAGES.rateLimitExceeded }, { status: 429 });
    }

    // Hasher avant la transaction (bcrypt est lent, on ne garde pas le verrou)
    const hashedPassword = await bcrypt.hash(passwordValidation.value, 12);

    // Vérification du code (5 essais max), changement du mot de passe et
    // consommation du code : une seule transaction
    const result = await userRepo.transaction(async (conn) => {
      const check = await checkResetCode(conn, emailValidation.value, code);
      if (!check.ok) return check;

      const { id, id_utilisateur } = check.reset;
      await conn.query(
        'UPDATE Utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?',
        [hashedPassword, id_utilisateur]
      );
      await conn.query('UPDATE PasswordReset SET used = 1 WHERE id = ?', [id]);
      await conn.query(
        'DELETE FROM PasswordReset WHERE id_utilisateur = ? AND id != ?',
        [id_utilisateur, id]
      );
      return { ok: true };
    });

    if (!result.ok) {
      return Response.json({ success: false, error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
      email: emailValidation.value
    });

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error.message);

    return Response.json({
      success: false,
      error: 'Erreur lors de la réinitialisation du mot de passe'
    }, { status: 500 });
  }
}
