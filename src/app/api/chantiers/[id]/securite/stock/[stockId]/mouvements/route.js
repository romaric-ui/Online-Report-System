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
    `SELECT m.*, CONCAT(u.prenom, ' ', u.nom) AS effectue_par_nom
     FROM MouvementStock m
     LEFT JOIN Utilisateur u ON u.id_utilisateur = m.effectue_par
     WHERE m.id_stock = ?
     ORDER BY m.date_mouvement DESC`,
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
  const { type_mouvement, quantite, motif, destination } = body;

  if (!type_mouvement) throw new ValidationError('type_mouvement est requis');
  if (!quantite || parseInt(quantite, 10) <= 0) throw new ValidationError('quantite doit être > 0');

  const qty = parseInt(quantite, 10);

  const db = await connectDB();
  await db.query(
    `INSERT INTO MouvementStock (id_stock, type_mouvement, quantite, motif, destination, effectue_par)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [stockId, type_mouvement, qty, motif || null, destination || null, parseInt(session.user.id, 10)]
  );

  const delta = ['entree'].includes(type_mouvement) ? qty : -qty;
  const newQty = Math.max(0, parseInt(article.quantite, 10) + delta);
  await stockSecuriteRepo.update(stockId, { quantite: newQty });

  return createdResponse({ message: 'Mouvement enregistré', nouvelle_quantite: newQty });
}

export const GET  = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
