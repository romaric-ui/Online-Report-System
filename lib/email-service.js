import nodemailer from 'nodemailer';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Template HTML pour l'email OTP
function getOTPEmailTemplate(otp, userName) {
  return `
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
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .otp-box {
          background: #f8f9fa;
          border: 2px dashed #667eea;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 8px;
          margin: 10px 0;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        .warning {
          color: #dc3545;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Vérification de votre compte</h1>
          <p>Société de Gestion des Travaux et Encadrement de chantier</p>
        </div>
        <div class="content">
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p>Merci de vous être inscrit sur la plateforme <strong>Société de Gestion des Travaux et Encadrement de chantier</strong> ! Pour finaliser votre inscription, veuillez utiliser le code de vérification ci-dessous :</p>
          
          <div class="otp-box">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">Votre code de vérification</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 0; color: #6c757d; font-size: 12px;">Ce code expire dans 10 minutes</p>
          </div>
          
          <p>Entrez ce code sur la page de vérification pour activer votre compte.</p>
          
          <p class="warning">
            ⚠️ Si vous n'avez pas demandé ce code, veuillez ignorer cet email.
          </p>
          
          <p>Cordialement,<br><strong>L'équipe Société de Gestion des Travaux et Encadrement de chantier</strong><br>Support Technique</p>
        </div>
        <div class="footer">
          <p>© 2025 Société de Gestion des Travaux et Encadrement de chantier. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Envoyer un email OTP
export async function sendOTPEmail(email, otp, userName) {
  try {
    const mailOptions = {
      from: `"Société de Gestion des Travaux et Encadrement de chantier - Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Code de vérification - Société de Gestion des Travaux et Encadrement de chantier',
      html: getOTPEmailTemplate(otp, userName)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email OTP envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
}

// Template HTML pour notification de nouveau message à l'admin
function getMessageNotificationTemplate(userName, userEmail, sujet, contenu) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .message-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .user-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📬 Nouveau message reçu</h1>
          <p>Société de Gestion des Travaux et Encadrement de chantier</p>
        </div>
        <div class="content">
          <p>Un utilisateur vous a envoyé un message :</p>
          
          <div class="user-info">
            <strong>👤 Utilisateur :</strong> ${userName}<br>
            <strong>✉️ Email :</strong> ${userEmail}
          </div>
          
          <div class="message-box">
            <p><strong>📌 Sujet :</strong> ${sujet}</p>
            <p><strong>💬 Message :</strong></p>
            <p style="white-space: pre-wrap;">${contenu}</p>
          </div>
          
          <p>Connectez-vous au dashboard admin pour répondre : <a href="${process.env.NEXTAUTH_URL}/admin/messages">Voir le message</a></p>
        </div>
        <div class="footer">
          <p>© 2025 Société de Gestion des Travaux et Encadrement de chantier. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Envoyer notification de nouveau message à l'admin
export async function sendMessageNotificationEmail(adminEmail, userName, userEmail, sujet, contenu) {
  try {
    const mailOptions = {
      from: `"Société de Gestion des Travaux et Encadrement de chantier - Notification" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Nouveau message de ${userName} - Société de Gestion des Travaux et Encadrement de chantier`,
      html: getMessageNotificationTemplate(userName, userEmail, sujet, contenu)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notification admin envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email notification:', error);
    return { success: false, error: error.message };
  }
}
