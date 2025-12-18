// API pour demander la réinitialisation du mot de passe
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { connectDB } from '../../../../../lib/database.js';
import { validateEmail } from '../../../../../lib/security.js';

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
      'SELECT id_utilisateur, nom, prenom FROM utilisateur WHERE email = ? LIMIT 1',
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
    
    // Générer un code de réinitialisation à 6 chiffres
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expire dans 10 minutes
    
    // Créer la table si elle n'existe pas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS PasswordReset (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_utilisateur INT NOT NULL,
        code VARCHAR(6) NOT NULL,
        email VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
        INDEX idx_code (code),
        INDEX idx_email (email),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Supprimer les anciens codes pour cet utilisateur
    await db.execute(
      'DELETE FROM PasswordReset WHERE id_utilisateur = ?',
      [user.id_utilisateur]
    );
    
    // Insérer le nouveau code
    await db.execute(
      'INSERT INTO PasswordReset (id_utilisateur, code, email, expires_at) VALUES (?, ?, ?, ?)',
      [user.id_utilisateur, resetCode, cleanEmail, expiresAt]
    );
    
    // Configurer le transporteur email (support EMAIL_* ou GMAIL_*)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || process.env.GMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Options de l'email
    const mailOptions = {
      from: `"Société de Gestion des Travaux et Encadrement de chantier - Support" <${process.env.EMAIL_USER || process.env.GMAIL_USER}>`,
      to: cleanEmail,
      subject: 'Code de réinitialisation de mot de passe - Société de Gestion des Travaux et Encadrement de chantier',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
            .code { font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 10px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
            .security { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Réinitialisation de mot de passe</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Société de Gestion des Travaux et Encadrement de chantier</p>
            </div>
            <div class="content">
              <p>Bonjour ${user.prenom} ${user.nom},</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe sur la plateforme <strong>Société de Gestion des Travaux et Encadrement de chantier</strong>.</p>
              
              <p>Utilisez le code de vérification ci-dessous pour réinitialiser votre mot de passe :</p>
              
              <div class="code-box">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">Votre code de réinitialisation</p>
                <div class="code">${resetCode}</div>
                <p style="margin: 0; color: #6c757d; font-size: 12px;">Ce code expire dans 10 minutes</p>
              </div>
              
              <div class="warning">
                ⏱️ <strong>Ce code expire dans 10 minutes.</strong> Rendez-vous sur la page de réinitialisation et entrez ce code.
              </div>
              
              <div class="security">
                🔒 <strong>Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.
              </div>
              
              <p>Cordialement,<br><strong>L'équipe Société de Gestion des Travaux et Encadrement de chantier</strong><br>Support Technique</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>&copy; 2025 Société de Gestion des Travaux et Encadrement de chantier. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Réinitialisation de mot de passe - Société de Gestion des Travaux et Encadrement de chantier
        
        Bonjour ${user.prenom} ${user.nom},
        
        Vous avez demandé la réinitialisation de votre mot de passe.
        
        Votre code de réinitialisation : ${resetCode}
        
        Ce code expire dans 10 minutes.
        
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        
        Cordialement,
        L'équipe Société de Gestion des Travaux et Encadrement de chantier
      `
    };
    
    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    return Response.json({
      success: true,
      message: 'Si cet email existe, un code de réinitialisation a été envoyé'
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