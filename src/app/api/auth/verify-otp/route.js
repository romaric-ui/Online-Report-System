import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../../../lib/database.js';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email et code OTP requis' },
        { status: 400 }
      );
    }

    const connection = await getDbConnection();

    // Vérifier l'OTP
    const [otpRecords] = await connection.execute(
      'SELECT * FROM otp_verification WHERE email = ? AND otp_code = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (otpRecords.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 400 }
      );
    }

    const otpRecord = otpRecords[0];

    // Activer le compte utilisateur
    await connection.execute(
      'UPDATE Utilisateur SET email_verified = TRUE WHERE id_utilisateur = ?',
      [otpRecord.user_id]
    );

    // Supprimer l'OTP utilisé
    await connection.execute(
      'DELETE FROM otp_verification WHERE id = ?',
      [otpRecord.id]
    );

    await connection.end();

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
