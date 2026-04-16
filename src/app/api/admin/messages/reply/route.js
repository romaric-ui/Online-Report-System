import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { messageRepo } from '../../../../../../lib/repositories/message.repository.js';
import { successResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { AuthorizationError, ValidationError, NotFoundError } from '../../../../../../lib/errors/index.js';
import { createNotification } from '../../../../../../lib/notifications';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    throw new AuthorizationError('Non autorisé');
  }

  const { userEmail, userName, originalSubject, reponse, userId, id_message } = await request.json();
  if (!userEmail || !reponse || !userId) {
    throw new ValidationError('Email, userId et réponse requis');
  }

  const userRows = await messageRepo.raw(
    'SELECT id_utilisateur FROM Utilisateur WHERE id_utilisateur = ? LIMIT 1',
    [userId]
  );

  if (!userRows.length) {
    throw new NotFoundError('Utilisateur introuvable');
  }

  if (id_message) {
    await messageRepo.raw(
      'UPDATE Message SET statut = ?, date_reponse = NOW() WHERE id_message = ?',
      ['repondu', id_message]
    );
  }

  await transporter.sendMail({
    from: `"Société de Gestion des Travaux et Encadrement de chantier - Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Re: ${originalSubject || 'Votre message'} - Société de Gestion des Travaux et Encadrement de chantier`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .message-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .message-box p {
            margin: 0;
            color: #555;
            line-height: 1.6;
            white-space: pre-wrap;
          }
          .original-subject {
            background: #e9ecef;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .original-subject strong {
            color: #495057;
            font-size: 14px;
          }
          .original-subject p {
            margin: 5px 0 0;
            color: #6c757d;
            font-size: 13px;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 5px 0;
            color: #6c757d;
            font-size: 14px;
          }
          .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
          }
          .signature p {
            margin: 5px 0;
            color: #333;
          }
          .signature strong {
            color: #667eea;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Réponse de l'Administrateur</h1>
            <p>SGTEC - Système de Gestion Technique</p>
          </div>
          <div class="content">
            <p class="greeting">Bonjour ${userName || 'Utilisateur'},</p>
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.
              Voici notre réponse :
            </p>
            ${originalSubject ? `
              <div class="original-subject">
                <strong>Concernant votre message :</strong>
                <p>${originalSubject}</p>
              </div>
            ` : ''}
            <div class="message-box">
              <p>${reponse.replace(/\n/g, '<br>')}</p>
            </div>
            <p style="color: #555; line-height: 1.6; margin-top: 30px;">
              Si vous avez d'autres questions ou besoin d'assistance supplémentaire,
              n'hésitez pas à nous contacter à nouveau.
            </p>
            <div class="signature">
              <p><strong>L'équipe SGTEC</strong></p>
              <p>Support Technique</p>
              <p style="font-size: 13px; color: #6c757d;">📧 ${process.env.EMAIL_USER}</p>
            </div>
          </div>
          <div class="footer">
            <p><strong>SGTEC - Système de Gestion Technique</strong></p>
            <p>© 2025 SGTEC. Tous droits réservés.</p>
            <p style="font-size: 12px; margin-top: 15px;">Cet email a été envoyé en réponse à votre demande de support.</p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  await createNotification({
    userId,
    type: 'message',
    titre: 'Nouvelle réponse de l\'administrateur',
    message: `L'administrateur a répondu à votre message "${originalSubject || 'Votre message'}"`,
    lien: '/dashboard#contact'
  });

  return successResponse({ message: 'Réponse envoyée avec succès' });
}

export const POST = apiHandler(handlePOST);
