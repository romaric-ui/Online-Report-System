import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { reportRepo } from '../../../../../lib/repositories/report.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError } from '../../../../../lib/errors/index.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

function requireAdmin(session) {
  if (!session) {
    throw new AuthenticationError('Non authentifié');
  }
  if (session.user.role !== 'admin') {
    throw new AuthorizationError('Accès refusé: rôle admin requis');
  }
}

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  requireAdmin(session);

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get('statut');

  let query = `
    SELECT 
      r.*,
      u.nom as createur_nom,
      u.prenom as createur_prenom,
      u.email as createur_email,
      v.nom as validateur_nom,
      v.prenom as validateur_prenom
    FROM Rapport r
    JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
    LEFT JOIN Utilisateur v ON r.id_validateur = v.id_utilisateur
  `;
  const params = [];

  if (statut) {
    query += ' WHERE r.statut = ?';
    params.push(statut);
  }

  query += `
    ORDER BY 
      CASE 
        WHEN r.statut = 'en_attente' OR r.statut IS NULL THEN 0
        ELSE 1
      END,
      r.date_creation DESC`;

  const reports = await reportRepo.raw(query, params);
  return successResponse({ reports });
}

async function handlePUT(request) {
  const session = await getServerSession(authOptions);
  requireAdmin(session);

  const body = await request.json();
  const { id_rapport, statut, commentaire_admin } = body;

  if (!id_rapport || !statut) {
    throw new ValidationError('ID rapport et statut requis');
  }

  if (!['valide', 'rejete'].includes(statut)) {
    throw new ValidationError('Statut invalide (valide ou rejete)');
  }

  const rapportInfo = await reportRepo.raw(
    `SELECT 
      r.nom_chantier,
      r.numero_rapport,
      u.email,
      u.nom,
      u.prenom
    FROM Rapport r
    JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
    WHERE r.id_rapport = ?`,
    [id_rapport]
  );

  if (!rapportInfo.length) {
    throw new NotFoundError('Rapport non trouvé');
  }

  if (statut === 'valide') {
    await reportRepo.validate(id_rapport, session.user.id, commentaire_admin || null);
  } else {
    await reportRepo.reject(id_rapport, session.user.id, commentaire_admin || null);
  }

  try {
    const { email, nom, prenom, nom_chantier, numero_rapport } = rapportInfo[0];
    const statutTexte = statut === 'valide' ? 'validé ✅' : 'rejeté ❌';
    const couleur = statut === 'valide' ? '#10b981' : '#ef4444';

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Rapport ${numero_rapport} ${statutTexte}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">OnlineReports</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">Bonjour ${prenom} ${nom},</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid ${couleur};">
              <h2 style="color: ${couleur}; margin-top: 0;">Rapport ${statutTexte}</h2>
              <p style="color: #6b7280; margin: 10px 0;"><strong>Chantier:</strong> ${nom_chantier}</p>
              <p style="color: #6b7280; margin: 10px 0;"><strong>N° Rapport:</strong> ${numero_rapport}</p>
              ${commentaire_admin ? `
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 15px;">
                  <p style="color: #374151; margin: 0;"><strong>Commentaire admin:</strong></p>
                  <p style="color: #6b7280; margin: 10px 0 0 0;">${commentaire_admin}</p>
                </div>
              ` : ''}
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Voir mes rapports
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
              Ceci est un email automatique, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('⚠️ Erreur envoi email:', emailError);
  }

  return successResponse({ message: `Rapport ${statut} avec succès`, emailSent: true });
}

async function handleDELETE(request) {
  const session = await getServerSession(authOptions);
  requireAdmin(session);

  const { searchParams } = new URL(request.url);
  const id_rapport = searchParams.get('id');
  if (!id_rapport) {
    throw new ValidationError('ID rapport manquant');
  }

  await reportRepo.delete(id_rapport);
  return successResponse({ message: 'Rapport supprimé avec succès' });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
