import { NextResponse } from 'next/server';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email et code OTP requis' },
        { status: 400 }
      );
    }

    // Validation OTP + marquage email + nettoyage OTPs : tout dans une transaction
    const result = await userRepo.transaction(async (conn) => {
      // 1. Chercher un OTP valide non expiré
      const [otpRecords] = await conn.query(
        'SELECT * FROM otp_verification WHERE email = ? AND otp_code = ? AND expires_at > NOW() LIMIT 1',
        [email, otp]
      );

      if (!otpRecords.length) {
        return { ok: false, error: 'Code invalide ou expiré' };
      }

      const otpRecord = otpRecords[0];

      // 2. Marquer l'email comme vérifié (via la méthode du repo, transaction-aware)
      await userRepo.markEmailVerified(otpRecord.user_id, conn);

      // 3. Supprimer tous les OTPs pour cet email (évite les codes orphelins)
      await conn.query(
        'DELETE FROM otp_verification WHERE email = ?',
        [email]
      );

      return { ok: true, userId: otpRecord.user_id };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès',
      userId: result.userId,
    });

  } catch (error) {
    console.error('❌ Erreur vérification OTP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}