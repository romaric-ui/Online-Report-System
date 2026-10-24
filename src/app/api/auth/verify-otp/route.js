import { NextResponse } from 'next/server';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { checkVerificationCode } from '../../../../../lib/auth-codes.js';
import { validateEmail, rateLimitCheck, getClientIp } from '../../../../../lib/security.js';
import { SECURITY_CONFIG, SECURITY_MESSAGES } from '../../../../../lib/security-config.js';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid || !otp) {
      return NextResponse.json(
        { error: 'Email et code OTP requis' },
        { status: 400 }
      );
    }
    const cleanEmail = emailValidation.value;

    const { codeVerify } = SECURITY_CONFIG.rateLimits;
    const ip = getClientIp(request.headers);
    if (!rateLimitCheck(`code-verify-ip:${ip}`, codeVerify.maxAttemptsPerIp, codeVerify.windowMs).allowed) {
      return NextResponse.json({ error: SECURITY_MESSAGES.rateLimitExceeded }, { status: 429 });
    }

    // Vérification (5 essais max par code) + marquage email + nettoyage : une transaction
    const result = await userRepo.transaction(async (conn) => {
      const check = await checkVerificationCode(conn, cleanEmail, otp);
      if (!check.ok) return check;

      await userRepo.markEmailVerified(check.userId, conn);
      await conn.query('DELETE FROM otp_verification WHERE user_id = ?', [check.userId]);

      return { ok: true, userId: check.userId };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès',
    });

  } catch (error) {
    console.error('❌ Erreur vérification OTP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
