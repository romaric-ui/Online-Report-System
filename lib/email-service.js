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

// Template HTML pour email d'invitation entreprise
function getInvitationEmailTemplate(entrepriseNom, roleNom, lienInvitation, invitePar) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 26px; }
        .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .invite-box { background: #f5f3ff; border: 2px solid #4f46e5; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0; }
        .role-badge { display: inline-block; background: #4f46e5; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .btn { display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
        .link-box { background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px; word-break: break-all; color: #64748b; margin-top: 15px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vous êtes invité !</h1>
          <p>SGTEC — Gestion de chantier BTP</p>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p><strong>${invitePar}</strong> vous invite à rejoindre l'entreprise <strong>${entrepriseNom}</strong> sur la plateforme SGTEC.</p>
          <div class="invite-box">
            <p style="margin:0;color:#6c757d;font-size:14px;">Rôle attribué</p>
            <div class="role-badge">${roleNom}</div>
            <br>
            <a href="${lienInvitation}" class="btn">Accepter l'invitation</a>
          </div>
          <p>Ou copiez ce lien dans votre navigateur :</p>
          <div class="link-box">${lienInvitation}</div>
          <p style="color:#dc3545;font-size:13px;margin-top:20px;">⏳ Cette invitation expire dans 7 jours. Si vous n'êtes pas concerné, ignorez cet email.</p>
        </div>
        <div class="footer">
          <p>© 2025 SGTEC. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Envoyer un email d'invitation entreprise
export async function sendInvitationEmail(email, entrepriseNom, roleNom, lienInvitation, invitePar) {
  try {
    const mailOptions = {
      from: `"SGTEC — Invitations" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Invitation à rejoindre ${entrepriseNom} sur SGTEC`,
      html: getInvitationEmailTemplate(entrepriseNom, roleNom, lienInvitation, invitePar),
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email invitation envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email invitation:', error);
    return { success: false, error: error.message };
  }
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
