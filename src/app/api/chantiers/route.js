import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { chantierRepo } from '../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../lib/tenant.js';
import { AuthenticationError, ValidationError } from '../../../../lib/errors/index.js';
import { checkPlanLimit } from '../../../../lib/plan-guard.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const limit = parsePositiveInt(searchParams.get('limit'), 20);
  const search = searchParams.get('search') || undefined;
  const statut = searchParams.get('statut') || undefined;

  const chantiers = await chantierRepo.findByEntreprise(entrepriseId, {
    page,
    limit,
    search,
    statut,
  });

  return successResponse(chantiers);
}

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  requireRole(session, [1, 2]); // admin entreprise + chef de chantier
  await checkPlanLimit(entrepriseId, 'chantier');
  const body = await request.json();
  const {
    nom,
    reference,
    client_nom,
    client_telephone,
    client_email,
    adresse,
    ville,
    pays,
    date_debut,
    date_fin_prevue,
    budget_prevu,
    description,
  } = body;

  if (!nom) {
    throw new ValidationError('Le nom du chantier est requis');
  }

  if (date_debut && date_fin_prevue && date_fin_prevue < date_debut) {
    throw new ValidationError('La date de fin doit être supérieure ou égale à la date de début');
  }

  const chantier = await chantierRepo.create({
    id_entreprise: entrepriseId,
    nom,
    reference: reference || null,
    client_nom: client_nom || null,
    client_telephone: client_telephone || null,
    client_email: client_email || null,
    adresse: adresse || null,
    ville: ville || null,
    pays: pays || null,
    date_debut: date_debut || null,
    date_fin_prevue: date_fin_prevue || null,
    budget_prevu: budget_prevu || null,
    description: description || null,
    created_by: parseInt(session.user.id, 10),
  });

  return createdResponse({ message: 'Chantier créé avec succès', id_chantier: chantier.id_chantier });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
