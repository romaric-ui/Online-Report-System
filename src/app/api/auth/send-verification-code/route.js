// API pour envoyer un code de vérification par email
import nodemailer from 'nodemailer';
import { connectDB } from '../../../../lib/database.js';
import { validateEmail } from '../../../../lib/security.js';

// Générer un code de vérification à 6 chiffres
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    // Validation de l'email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return Response.json({
        success: false,
        error: 'Format d\'email invalide'
      }, { status: 400 });
    }
    
    const cleanEmail = emailValidation.value;
    const db = await connectDB();
    
    // Vérifier si l'email existe déjà
    const [existingUser] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ? LIMIT 1',
      [cleanEmail]
    );
    
    if (existingUser.length > 0) {
      return Response.json({
        success: false,
        error: 'Un compte avec cet email existe déjà'
      }, { status: 409 });
    }
    
    // Générer le code de vérification
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expire dans 10 minutes
    
    // Sauvegarder le code en base de données (table temporaire)
    // D'abord, créer la table si elle n'existe pas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS CodeVerification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_code (email, code),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Supprimer les anciens codes pour cet email
    await db.execute(
      'DELETE FROM CodeVerification WHERE email = ?',
      [cleanEmail]
    );
    
    // Insérer le nouveau code
    await db.execute(
      'INSERT INTO CodeVerification (email, code, expires_at) VALUES (?, ?, ?)',
      [cleanEmail, verificationCode, expiresAt]
    );
    
    // Configurer le transporteur email (utiliser Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Votre email Gmail
        pass: process.env.GMAIL_APP_PASSWORD // Mot de passe d'application Gmail
      }
    });
    
    // Options de l'email
    const mailOptions = {
      from: `"Online Report System" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Code de vérification - Online Report System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Vérification de votre email</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Merci de vous inscrire sur <strong>Online Report System</strong> !</p>
              <p>Voici votre code de vérification :</p>
              
              <div class="code-box">
                <div class="code">${verificationCode}</div>
              </div>
              
              <div class="warning">
                ⏱️ <strong>Ce code expire dans 10 minutes.</strong>
              </div>
              
              <p>Entrez ce code sur la page d'inscription pour confirmer votre adresse email et finaliser la création de votre compte.</p>
              
              <p><strong>Si vous n'avez pas demandé ce code, ignorez cet email.</strong></p>
              
              <p>Cordialement,<br>L'équipe Online Report System</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>&copy; 2025 Online Report System. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Code de vérification - Online Report System
        
        Bonjour,
        
        Merci de vous inscrire sur Online Report System !
        
        Votre code de vérification : ${verificationCode}
        
        Ce code expire dans 10 minutes.
        
        Entrez ce code sur la page d'inscription pour confirmer votre adresse email.
        
        Si vous n'avez pas demandé ce code, ignorez cet email.
        
        Cordialement,
        L'équipe Online Report System
      `
    };
    
    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    return Response.json({
      success: true,
      message: 'Code de vérification envoyé par email',
      email: cleanEmail,
      expiresIn: '10 minutes'
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi code:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Erreur lors de l\'envoi du code de vérification',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}