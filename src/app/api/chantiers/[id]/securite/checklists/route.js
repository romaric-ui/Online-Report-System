import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { checklistRepo } from '../../../../../../../lib/repositories/checklist.repository.js';
import { chantierRepo } from '../../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function parseChantierId(params) {
  const resolved = await params;
  const id = parseInt(resolved.id, 10);
  if (!id || Number.isNaN(id) || id <= 0) throw new ValidationError('ID chantier invalide');
  return id;
}

async function verifyChantierEntreprise(chantierId, entrepriseId) {
  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }
  return chantier;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 200);
  const type_checklist = searchParams.get('type_checklist') || undefined;

  const checklists = await checklistRepo.findByChantier(chantierId, { page, limit, type_checklist });
  return successResponse(checklists);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { type_checklist, items = [] } = body;

  if (!type_checklist) throw new ValidationError('type_checklist est requis');
  if (!Array.isArray(items) || items.length === 0) throw new ValidationError('Au moins une question est requise');

  const checklistId = await checklistRepo.transaction(async (conn) => {
    const [res] = await conn.query(
      'INSERT INTO ChecklistSecurite (id_chantier, date_checklist, type_checklist, remplie_par, statut) VALUES (?, CURDATE(), ?, ?, ?)',
      [chantierId, type_checklist, parseInt(session.user.id, 10), 'en_cours']
    );
    const id = res.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO ItemChecklist (id_checklist, question, categorie) VALUES (?, ?, ?)',
        [id, item.question, item.categorie || null]
      );
    }

    return id;
  });

  return createdResponse({ id_checklist: checklistId, message: 'Checklist créée avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
