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

const APP_NAME = 'PROJECTRA';
const APP_FULL = 'PROJECTRA — Pilotez. Planifiez. Réalisez. Réussissez.';
const APP_URL = process.env.NEXTAUTH_URL || 'https://projectra.com';
const YEAR = new Date().getFullYear();

const LOGO_URL = `${APP_URL}/logo_projectra.png`;

function emailHeader(title) {
  return `
    <div class="header">
      <img src="${LOGO_URL}" alt="PROJECTRA" style="height:64px;width:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
      <h1>${title}</h1>
      <p>${APP_FULL}</p>
    </div>
  `;
}

function emailFooter() {
  return `
    <div class="footer">
      <p>© ${YEAR} ${APP_NAME}. Tous droits réservés.</p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#9ca3af;">
        <a href="${APP_URL}" style="color:#F97316;text-decoration:none;">${APP_URL}</a>
      </p>
    </div>
  `;
}

const BASE_STYLES = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.10); }
  .header { background: linear-gradient(135deg, #1E3A5F 0%, #2d5a8e 100%); padding: 36px 20px 28px; text-align: center; color: white; }
  .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 700; }
  .header p { margin: 0; font-size: 13px; opacity: 0.85; }
  .content { padding: 36px 32px; color: #1f2937; font-size: 15px; line-height: 1.6; }
  .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
`;

function getOTPEmailTemplate(otp, userName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${BASE_STYLES}
        .otp-box { background: #fff7ed; border: 2px dashed #F97316; border-radius: 10px; padding: 28px; text-align: center; margin: 28px 0; }
        .otp-code { font-size: 40px; font-weight: 800; color: #F97316; letter-spacing: 10px; margin: 10px 0; font-family: 'Courier New', monospace; }
        .warning { color: #dc2626; font-size: 13px; margin-top: 20px; background: #fef2f2; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        ${emailHeader('🔐 Vérification de votre compte')}
        <div class="content">
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p>Pour finaliser votre inscription sur <strong>${APP_NAME}</strong>, utilisez le code ci-dessous :</p>
          <div class="otp-box">
            <p style="margin:0;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Votre code de vérification</p>
            <div class="otp-code">${otp}</div>
            <p style="margin:0;color:#6b7280;font-size:12px;">Ce code expire dans <strong>10 minutes</strong></p>
          </div>
          <p class="warning">⚠️ Si vous n'avez pas demandé ce code, ignorez cet email.</p>
          <p>Cordialement,<br><strong>L'équipe ${APP_NAME}</strong></p>
        </div>
        ${emailFooter()}
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
        ${BASE_STYLES}
        .invite-box { background: #fff7ed; border: 2px solid #F97316; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; }
        .role-badge { display: inline-block; background: #F97316; color: white; padding: 6px 18px; border-radius: 20px; font-size: 13px; font-weight: 700; margin: 10px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #F97316, #ea6500); color: white !important; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 16px 0; }
        .link-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 12px; word-break: break-all; color: #6b7280; margin-top: 12px; }
        .expiry { color: #dc2626; font-size: 13px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${emailHeader('🎉 Vous êtes invité !')}
        <div class="content">
          <p>Bonjour,</p>
          <p><strong>${invitePar}</strong> vous invite à rejoindre <strong>${entrepriseNom}</strong> sur ${APP_NAME}.</p>
          <div class="invite-box">
            <p style="margin:0 0 6px 0;color:#6b7280;font-size:13px;">Rôle attribué</p>
            <div class="role-badge">${roleNom}</div>
            <br>
            <a href="${lienInvitation}" class="btn">Accepter l'invitation</a>
          </div>
          <p style="color:#6b7280;font-size:13px;">Ou copiez ce lien dans votre navigateur :</p>
          <div class="link-box">${lienInvitation}</div>
          <p class="expiry">⏳ Cette invitation expire dans 7 jours.</p>
        </div>
        ${emailFooter()}
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
        ${BASE_STYLES}
        .user-info { background: #f0f9ff; border: 1px solid #bae6fd; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
        .message-box { background: #f9fafb; border-left: 4px solid #F97316; padding: 18px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #F97316, #ea6500); color: white !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${emailHeader('📬 Nouveau message reçu')}
        <div class="content">
          <div class="user-info">
            <strong>👤 Utilisateur :</strong> ${userName}<br>
            <strong>✉️ Email :</strong> ${userEmail}
          </div>
          <div class="message-box">
            <p style="margin:0 0 10px 0;"><strong>📌 Sujet :</strong> ${sujet}</p>
            <p style="margin:0 0 6px 0;"><strong>💬 Message :</strong></p>
            <p style="white-space:pre-wrap;margin:0;color:#374151;">${contenu}</p>
          </div>
          <a href="${APP_URL}/admin/messages" class="btn">Voir le message</a>
        </div>
        ${emailFooter()}
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