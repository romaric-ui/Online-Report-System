import { NextResponse } from 'next/server';
import { sendOTPEmail } from '../../../../../lib/email-service.js';
import { connectDB } from '../../../../../lib/database.js';

export async function POST(request) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email et ID utilisateur requis' },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const db = await connectDB();
    await db.query('DELETE FROM otp_verification WHERE user_id = ?', [userId]);
    await db.query(
      'INSERT INTO otp_verification (user_id, email, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, email, otp, expiresAt]
    );

    const emailResult = await sendOTPEmail(email, otp, email);

    if (!emailResult.success) {
      console.error('❌ Erreur envoi OTP:', emailResult.error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code OTP envoyé par email',
    });

  } catch (error) {
    console.error('❌ Erreur envoi OTP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du code' },
      { status: 500 }
    );
  }
}