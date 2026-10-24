import { NextResponse } from 'next/server';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { issueVerificationCode } from '../../../../../lib/auth-codes.js';
import { validateEmail, rateLimitCheck, getClientIp } from '../../../../../lib/security.js';
import { SECURITY_CONFIG, SECURITY_MESSAGES } from '../../../../../lib/security-config.js';

// Renvoie un code de vérification d'email.
// Seul l'email est lu : le code est lié au compte qui porte cet email, jamais à
// un identifiant fourni par le client.
export async function POST(request) {
  try {
    const { email } = await request.json();

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }
    const cleanEmail = emailValidation.value;

    const { codeSend } = SECURITY_CONFIG.rateLimits;
    const ip = getClientIp(request.headers);
    const byEmail = rateLimitCheck(`code-send:${cleanEmail}`, codeSend.maxAttempts, codeSend.windowMs);
    const byIp = rateLimitCheck(`code-send-ip:${ip}`, codeSend.maxAttemptsPerIp, codeSend.windowMs);
    if (!byEmail.allowed || !byIp.allowed) {
      return NextResponse.json({ error: SECURITY_MESSAGES.rateLimitExceeded }, { status: 429 });
    }

    const user = await userRepo.findByEmail(cleanEmail);

    // Même réponse si le compte n'existe pas, est déjà vérifié ou est bloqué :
    // la route ne doit pas révéler quels emails sont inscrits.
    const ok = NextResponse.json({
      success: true,
      message: 'Si un compte en attente de vérification existe, un code a été envoyé.',
    });
    if (!user || Number(user.email_verifie) === 1 || user.statut === 'bloque') {
      return ok;
    }

    const emailResult = await issueVerificationCode(user);
    if (!emailResult.success) {
      console.error('❌ Erreur envoi OTP:', emailResult.error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du code' },
        { status: 500 }
      );
    }

    return ok;

  } catch (error) {
    console.error('❌ Erreur envoi OTP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du code' },
      { status: 500 }
    );
  }
}
