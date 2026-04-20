import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../auth/[...nextauth]/options';
import { stockSecuriteRepo } from '../../../../../../../../../lib/repositories/stock-securite.repository.js';
import { chantierRepo } from '../../../../../../../../../lib/repositories/chantier.repository.js';
import { connectDB } from '../../../../../../../../../lib/database.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function resolveParams(params) {
  const resolved = await params;
  const chantierId = parseInt(resolved.id, 10);
  const stockId    = parseInt(resolved.stockId, 10);
  if (!chantierId || !stockId) throw new ValidationError('IDs invalides');
  return { chantierId, stockId };
}

async function verifyAccess(chantierId, stockId, entrepriseId) {
  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }
  const article = await stockSecuriteRepo.findById(stockId);
  if (parseInt(article.id_chantier, 10) !== chantierId) {
    throw new AuthorizationError('Cet article n\'appartient pas à ce chantier');
  }
  return article;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const { chantierId, stockId } = await resolveParams(params);
  await verifyAccess(chantierId, stockId, entrepriseId);

  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT v.*, CONCAT(u.prenom, ' ', u.nom) AS verificateur_nom
     FROM VerificationPeriodique v
     LEFT JOIN Utilisateur u ON u.id_utilisateur = v.verificateur
     WHERE v.id_stock = ?
     ORDER BY v.date_verification DESC`,
    [stockId]
  );
  return successResponse(rows);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const { chantierId, stockId } = await resolveParams(params);
  const article = await verifyAccess(chantierId, stockId, entrepriseId);

  const body = await request.json();
  const { resultat, observations, actions_correctives } = body;
  if (!resultat) throw new ValidationError('resultat est requis');

  const today = new Date().toISOString().slice(0, 10);
  const freq  = parseInt(article.frequence_verification_jours || 90, 10);
  const prochaine = new Date();
  prochaine.setDate(prochaine.getDate() + freq);
  const prochaineStr = prochaine.toISOString().slice(0, 10);

  const db = await connectDB();
  const [result] = await db.query(
    `INSERT INTO VerificationPeriodique
       (id_stock, date_verification, resultat, verificateur, observations, actions_correctives, prochaine_verification)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [stockId, today, resultat, parseInt(session.user.id, 10),
     observations || null, actions_correctives || null, prochaineStr]
  );

  await stockSecuriteRepo.update(stockId, {
    date_derniere_verification: today,
    date_prochaine_verification: prochaineStr,
  });

  return createdResponse({ id_verification: result.insertId, prochaine_verification: prochaineStr });
}

export const GET  = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
