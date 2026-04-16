import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth/[...nextauth]/options';
import { checklistRepo } from '../../../../../../../../lib/repositories/checklist.repository.js';
import { chantierRepo } from '../../../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, errorResponse } from '../../../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function parseParams(params) {
  const resolved = await params;
  const chantierId = parseInt(resolved.id, 10);
  const checklistId = parseInt(resolved.checklistId, 10);
  if (!chantierId || Number.isNaN(chantierId) || chantierId <= 0) throw new ValidationError('ID chantier invalide');
  if (!checklistId || Number.isNaN(checklistId) || checklistId <= 0) throw new ValidationError('ID checklist invalide');
  return { chantierId, checklistId };
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
  const { chantierId, checklistId } = await parseParams(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const checklist = await checklistRepo.findWithItems(checklistId);
  if (parseInt(checklist.id_chantier, 10) !== chantierId) {
    throw new AuthorizationError('Non autorisé pour cette checklist');
  }

  return successResponse(checklist);
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const { chantierId, checklistId } = await parseParams(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const checklist = await checklistRepo.findById(checklistId);
  if (parseInt(checklist.id_chantier, 10) !== chantierId) {
    throw new AuthorizationError('Non autorisé pour cette checklist');
  }

  const body = await request.json();
  const { items = [] } = body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items est requis');
  }

  // Mettre à jour chaque item
  await Promise.all(items.map(({ id_item, reponse, commentaire, action_corrective }) =>
    checklistRepo.raw(
      'UPDATE ItemChecklist SET reponse = ?, commentaire = ?, action_corrective = ? WHERE id_item = ? AND id_checklist = ?',
      [reponse || 'non_applicable', commentaire || null, action_corrective || null, id_item, checklistId]
    )
  ));

  // Recalculer le score
  await checklistRepo.calculateScore(checklistId);

  // Déterminer le nouveau statut
  const allItems = await checklistRepo.raw(
    'SELECT reponse FROM ItemChecklist WHERE id_checklist = ?',
    [checklistId]
  );
  const hasNonConforme = allItems.some(i => i.reponse === 'non_conforme');
  const newStatut = hasNonConforme ? 'non_conforme' : 'complete';
  await checklistRepo.update(checklistId, { statut: newStatut });

  return successResponse({ message: 'Checklist mise à jour', statut: newStatut });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
