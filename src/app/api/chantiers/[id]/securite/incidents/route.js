import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/options';
import { incidentRepo } from '../../../../../../../lib/repositories/incident.repository.js';
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
  const statut = searchParams.get('statut') || undefined;
  const gravite = searchParams.get('gravite') || undefined;

  const incidents = await incidentRepo.findByChantier(chantierId, { page, limit, statut, gravite });
  return successResponse(incidents);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const {
    type_incident,
    gravite,
    date_incident,
    description,
    lieu,
    victimes,
    temoins,
    causes,
    mesures_immediates,
    actions_correctives,
    jours_arret,
  } = body;

  if (!type_incident) throw new ValidationError('type_incident est requis');
  if (!gravite) throw new ValidationError('gravite est requise');
  if (!date_incident) throw new ValidationError('date_incident est requise');
  if (!description) throw new ValidationError('description est requise');

  const incident = await incidentRepo.create({
    id_chantier:         chantierId,
    type_incident,
    gravite,
    date_incident,
    description,
    lieu:                lieu || null,
    victimes:            victimes || null,
    temoins:             temoins || null,
    causes:              causes || null,
    mesures_immediates:  mesures_immediates || null,
    actions_correctives: actions_correctives || null,
    jours_arret:         jours_arret ? parseInt(jours_arret, 10) : 0,
    declare_par:         parseInt(session.user.id, 10),
    statut:              'declare',
  });

  return createdResponse({ id_incident: incident.id_incident, message: 'Incident déclaré avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
