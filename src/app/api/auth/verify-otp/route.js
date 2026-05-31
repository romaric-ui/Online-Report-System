import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database.js';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email et code OTP requis' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    const [otpRecords] = await db.query(
      'SELECT * FROM otp_verification WHERE email = ? AND otp_code = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (otpRecords.length === 0) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 400 }
      );
    }

    const otpRecord = otpRecords[0];

    await db.query(
      'UPDATE Utilisateur SET email_verifie = 1 WHERE id_utilisateur = ?',
      [otpRecord.user_id]
    );

    await db.query(
      'DELETE FROM otp_verification WHERE id = ?',
      [otpRecord.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès',
      userId: otpRecord.user_id,
    });

  } catch (error) {
    console.error('❌ Erreur vérification OTP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}