import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Configuration de base de données
const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = isProduction ? {
  host: process.env.AIVEN_HOST,
  user: process.env.AIVEN_USER,
  password: process.env.AIVEN_PASSWORD,
  database: process.env.AIVEN_DATABASE,
  port: process.env.AIVEN_PORT || 21094,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 60000,
} : {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'onlinereports',
  port: 3306,
  ssl: false,
  connectTimeout: 60000,
};

async function getDbConnection() {
  return await mysql.createConnection(dbConfig);
}

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
