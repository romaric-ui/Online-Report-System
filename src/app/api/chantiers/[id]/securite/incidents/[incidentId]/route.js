import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth/[...nextauth]/route';
import { incidentRepo } from '../../../../../../../../lib/repositories/incident.repository.js';
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
  const incidentId = parseInt(resolved.incidentId, 10);
  if (!chantierId || Number.isNaN(chantierId) || chantierId <= 0) throw new ValidationError('ID chantier invalide');
  if (!incidentId || Number.isNaN(incidentId) || incidentId <= 0) throw new ValidationError('ID incident invalide');
  return { chantierId, incidentId };
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
  const { chantierId, incidentId } = await parseParams(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const incident = await incidentRepo.findById(incidentId);
  if (parseInt(incident.id_chantier, 10) !== chantierId) {
    throw new AuthorizationError('Non autorisé pour cet incident');
  }

  return successResponse(incident);
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const { chantierId, incidentId } = await parseParams(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const incident = await incidentRepo.findById(incidentId);
  if (parseInt(incident.id_chantier, 10) !== chantierId) {
    throw new AuthorizationError('Non autorisé pour cet incident');
  }

  const body = await request.json();
  const updatableFields = [
    'statut', 'actions_correctives', 'causes', 'mesures_immediates',
    'victimes', 'temoins', 'jours_arret', 'lieu', 'description',
  ];

  const data = {};
  updatableFields.forEach((key) => {
    if (body[key] !== undefined) {
      data[key] = body[key] === '' ? null : body[key];
    }
  });

  if (Object.keys(data).length === 0) {
    throw new ValidationError('Aucune donnée à mettre à jour');
  }

  await incidentRepo.update(incidentId, data);
  return successResponse({ message: 'Incident mis à jour avec succès' });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
