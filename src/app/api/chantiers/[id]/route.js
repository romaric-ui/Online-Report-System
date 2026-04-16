import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { chantierRepo } from '../../../../../lib/repositories/chantier.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function parseChantierId(params) {
  const resolvedParams = await params;
  const chantierId = parseInt(resolvedParams.id, 10);
  if (!chantierId || Number.isNaN(chantierId) || chantierId <= 0) {
    throw new ValidationError('ID chantier invalide');
  }
  return chantierId;
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
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  const chantier = await verifyChantierEntreprise(chantierId, entrepriseId);
  const chantierWithStats = await chantierRepo.findWithStats(chantierId);

  return successResponse(chantierWithStats);
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  requireRole(session, [1, 2]); // admin entreprise + chef de chantier
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const sanitizedData = {};
  const updatableFields = [
    'nom', 'reference', 'client_nom', 'client_telephone', 'client_email',
    'adresse', 'ville', 'pays', 'latitude', 'longitude', 'date_debut',
    'date_fin_prevue', 'date_fin_reelle', 'statut', 'progression',
    'budget_prevu', 'image_url', 'description'
  ];

  updatableFields.forEach((key) => {
    if (body[key] !== undefined) {
      sanitizedData[key] = body[key] === '' ? null : body[key];
    }
  });

  if (Object.keys(sanitizedData).length === 0) {
    throw new ValidationError('Aucune donnée valide à mettre à jour');
  }

  await chantierRepo.update(chantierId, sanitizedData);
  return successResponse({ message: 'Chantier modifié avec succès' });
}

async function handleDELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  requireRole(session, [1, 2]); // admin entreprise + chef de chantier
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);
  await chantierRepo.delete(chantierId);

  return successResponse({ message: 'Chantier supprimé avec succès' });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
