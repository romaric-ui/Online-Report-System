import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const APP_NAME = 'SGTEC';
const APP_FULL = 'SGTEC — Gestion de chantier BTP';
const YEAR = new Date().getFullYear();

function getOTPEmailTemplate(otp, userName) {
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
        .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Vérification de votre compte</h1>
          <p>${APP_FULL}</p>
        </div>
        <div class="content">
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p>Pour finaliser votre inscription sur <strong>${APP_NAME}</strong>, utilisez le code ci-dessous :</p>
          <div class="otp-box">
            <p style="margin:0;color:#6c757d;font-size:14px;">Votre code de vérification</p>
            <div class="otp-code">${otp}</div>
            <p style="margin:0;color:#6c757d;font-size:12px;">Ce code expire dans 10 minutes</p>
          </div>
          <p class="warning">⚠️ Si vous n'avez pas demandé ce code, ignorez cet email.</p>
          <p>Cordialement,<br><strong>L'équipe ${APP_NAME}</strong></p>
        </div>
        <div class="footer">
          <p>© ${YEAR} ${APP_NAME}. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

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
          <p>${APP_FULL}</p>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p><strong>${invitePar}</strong> vous invite à rejoindre <strong>${entrepriseNom}</strong> sur ${APP_NAME}.</p>
          <div class="invite-box">
            <p style="margin:0;color:#6c757d;font-size:14px;">Rôle attribué</p>
            <div class="role-badge">${roleNom}</div>
            <br>
            <a href="${lienInvitation}" class="btn">Accepter l'invitation</a>
          </div>
          <p>Ou copiez ce lien :</p>
          <div class="link-box">${lienInvitation}</div>
          <p style="color:#dc3545;font-size:13px;margin-top:20px;">⏳ Cette invitation expire dans 7 jours.</p>
        </div>
        <div class="footer">
          <p>© ${YEAR} ${APP_NAME}. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

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
        </div>
        <div class="content">
          <div class="user-info">
            <strong>👤 Utilisateur :</strong> ${userName}<br>
            <strong>✉️ Email :</strong> ${userEmail}
          </div>
          <div class="message-box">
            <p><strong>📌 Sujet :</strong> ${sujet}</p>
            <p><strong>💬 Message :</strong></p>
            <p style="white-space:pre-wrap;">${contenu}</p>
          </div>
          <p>Connectez-vous au dashboard admin pour répondre : <a href="${process.env.NEXTAUTH_URL}/admin/messages">Voir le message</a></p>
        </div>
        <div class="footer">
          <p>© ${YEAR} ${APP_NAME}. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOTPEmail(email, otp, userName) {
  try {
    const info = await transporter.sendMail({
      from: `"${APP_NAME} — Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Code de vérification — ${APP_NAME}`,
      html: getOTPEmailTemplate(otp, userName),
    });
    console.log('✅ Email OTP envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi OTP:', error);
    return { success: false, error: error.message };
  }
}

export async function sendInvitationEmail(email, entrepriseNom, roleNom, lienInvitation, invitePar) {
  try {
    const info = await transporter.sendMail({
      from: `"${APP_NAME} — Invitations" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Invitation à rejoindre ${entrepriseNom} sur ${APP_NAME}`,
      html: getInvitationEmailTemplate(entrepriseNom, roleNom, lienInvitation, invitePar),
    });
    console.log('✅ Email invitation envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi invitation:', error);
    return { success: false, error: error.message };
  }
}

export async function sendMessageNotificationEmail(adminEmail, userName, userEmail, sujet, contenu) {
  try {
    const info = await transporter.sendMail({
      from: `"${APP_NAME} — Notifications" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Nouveau message de ${userName} — ${APP_NAME}`,
      html: getMessageNotificationTemplate(userName, userEmail, sujet, contenu),
    });
    console.log('✅ Email notification envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    return { success: false, error: error.message };
  }
}