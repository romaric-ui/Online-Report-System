// API pour demander la réinitialisation du mot de passe
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { connectDB } from '../../../../lib/database.js';
import { validateEmail } from '../../../../lib/security.js';

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
    
    // Vérifier si l'utilisateur existe
    const [users] = await db.execute(
      'SELECT id_utilisateur, nom, prenom FROM Utilisateur WHERE email = ? LIMIT 1',
      [cleanEmail]
    );
    
    // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
    if (users.length === 0) {
      // Retourner succès même si l'email n'existe pas
      return Response.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });
    }
    
    const user = users[0];
    
    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Expire dans 1 heure
    
    // Créer la table si elle n'existe pas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS PasswordReset (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_utilisateur INT NOT NULL,
        token VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Supprimer les anciens tokens pour cet utilisateur
    await db.execute(
      'DELETE FROM PasswordReset WHERE id_utilisateur = ?',
      [user.id_utilisateur]
    );
    
    // Insérer le nouveau token
    await db.execute(
      'INSERT INTO PasswordReset (id_utilisateur, token, expires_at) VALUES (?, ?, ?)',
      [user.id_utilisateur, hashedToken, expiresAt]
    );
    
    // Créer le lien de réinitialisation
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    // Configurer le transporteur email
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    // Options de l'email
    const mailOptions = {
      from: `"Online Report System" <${process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
            .security { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour ${user.prenom} ${user.nom},</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe sur <strong>Online Report System</strong>.</p>
              
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              </div>
              
              <div class="warning">
                ⏱️ <strong>Ce lien expire dans 1 heure.</strong>
              </div>
              
              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              
              <div class="security">
                🔒 <strong>Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.
              </div>
              
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
        Réinitialisation de mot de passe - Online Report System
        
        Bonjour ${user.prenom} ${user.nom},
        
        Vous avez demandé la réinitialisation de votre mot de passe.
        
        Cliquez sur ce lien pour créer un nouveau mot de passe :
        ${resetUrl}
        
        Ce lien expire dans 1 heure.
        
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        
        Cordialement,
        L'équipe Online Report System
      `
    };
    
    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    return Response.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    });
    
  } catch (error) {
    console.error('❌ Erreur mot de passe oublié:', error);
    
    return Response.json({
      success: false,
      error: 'Erreur lors de l\'envoi du lien de réinitialisation',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}