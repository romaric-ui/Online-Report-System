import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDbConnection } from '../../../../../lib/database.js';

// Configuration de l'email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email et ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Générer un code OTP à 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expire dans 10 minutes

    const connection = await getDbConnection();

    // Supprimer les anciens OTP de cet utilisateur
    await connection.execute(
      'DELETE FROM otp_verification WHERE user_id = ?',
      [userId]
    );

    // Stocker le nouveau OTP
    await connection.execute(
      'INSERT INTO otp_verification (user_id, email, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, email, otp, expiresAt]
    );

    await connection.end();

    // Envoyer l'email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Code de vérification - Online Report',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-code {
              display: inline-block;
              background: #f8f9fa;
              border: 2px dashed #667eea;
              border-radius: 10px;
              padding: 20px 40px;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #667eea;
              margin: 20px 0;
            }
            .info {
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Code de Vérification</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Voici votre code de vérification pour finaliser votre inscription :</p>
              <div class="otp-code">${otp}</div>
              <div class="info">
                <p>⏰ Ce code expire dans <strong>10 minutes</strong></p>
                <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Online Report System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

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
