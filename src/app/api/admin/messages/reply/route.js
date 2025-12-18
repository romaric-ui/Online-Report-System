import { getServerSession } from 'next-auth';
import nodemailer from 'nodemailer';
import { createNotification } from '../../../../../../lib/notifications';
import { connectDB } from '../../../../../../lib/database';

export async function POST(request) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession();
    
    if (!session || session.user?.role !== 'admin') {
      return Response.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { userEmail, userName, originalSubject, reponse, userId } = await request.json();

    // Valider les données
    if (!userEmail || !reponse || !userId) {
      return Response.json(
        { error: 'Email, userId et réponse requis' },
        { status: 400 }
      );
    }

    // Configuration du transporteur email
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

    // Template HTML pour la réponse
    const htmlTemplate = `
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
              <p style="font-size: 13px; color: #6c757d;">
                📧 ${process.env.EMAIL_USER}
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>SGTEC - Système de Gestion Technique</strong></p>
            <p>© 2025 SGTEC. Tous droits réservés.</p>
            <p style="font-size: 12px; margin-top: 15px;">
              Cet email a été envoyé en réponse à votre demande de support.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email
    await transporter.sendMail({
      from: `"Société de Gestion des Travaux et Encadrement de chantier - Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Re: ${originalSubject || 'Votre message'} - Société de Gestion des Travaux et Encadrement de chantier`,
      html: htmlTemplate,
    });

    // Créer une notification pour l'utilisateur
    await createNotification({
      userId: userId,
      type: 'message',
      titre: 'Nouvelle réponse de l\'administrateur',
      contenu: `L'administrateur a répondu à votre message "${originalSubject || 'Votre message'}"`,
      lien: '/dashboard#contact'
    });

    console.log('✅ Réponse envoyée à:', userEmail);

    return Response.json({
      success: true,
      message: 'Réponse envoyée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la réponse:', error);
    return Response.json(
      { error: 'Erreur lors de l\'envoi de la réponse' },
      { status: 500 }
    );
  }
}
