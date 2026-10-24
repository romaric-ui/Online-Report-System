// API pour vérifier le code de réinitialisation sans changer le mot de passe
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { checkResetCode } from '../../../../../lib/auth-codes.js';
import { validateEmail, rateLimitCheck, getClientIp } from '../../../../../lib/security.js';
import { SECURITY_CONFIG, SECURITY_MESSAGES } from '../../../../../lib/security-config.js';

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    // Validations de base
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid || !code) {
      return Response.json({
        success: false,
        error: 'Email et code requis'
      }, { status: 400 });
    }

    if (String(code).length !== 6) {
      return Response.json({
        success: false,
        error: 'Le code doit contenir 6 chiffres'
      }, { status: 400 });
    }

    const { codeVerify } = SECURITY_CONFIG.rateLimits;
    const ip = getClientIp(request.headers);
    if (!rateLimitCheck(`code-verify-ip:${ip}`, codeVerify.maxAttemptsPerIp, codeVerify.windowMs).allowed) {
      return Response.json({ success: false, error: SECURITY_MESSAGES.rateLimitExceeded }, { status: 429 });
    }

    // Vérifier le code (chaque échec compte, 5 essais max)
    const result = await userRepo.transaction((conn) =>
      checkResetCode(conn, emailValidation.value, code)
    );

    if (!result.ok) {
      return Response.json({ success: false, error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: 'Code valide ! Vous pouvez maintenant créer un nouveau mot de passe.'
    });

  } catch (error) {
    console.error('❌ Erreur vérification code:', error);

    return Response.json({
      success: false,
      error: 'Erreur lors de la vérification du code'
    }, { status: 500 });
  }
}
