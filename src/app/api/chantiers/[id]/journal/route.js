import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { journalRepo } from '../../../../../lib/repositories/journal.repository.js';
import { chantierRepo } from '../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

function parseChantierId(params) {
  const chantierId = parseInt(params.id, 10);
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
  const chantierId = parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  const journals = await journalRepo.findByChantier(chantierId, { page, limit });
  return successResponse(journals);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  const chantierId = parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const {
    date_journal,
    meteo,
    resume,
    travaux_realises,
    problemes,
    decisions,
    observations,
  } = body;

  const journal = await journalRepo.create({
    id_chantier: chantierId,
    date_journal: date_journal || new Date().toISOString().split('T')[0],
    meteo: meteo || null,
    resume: resume || null,
    travaux_realises: travaux_realises || null,
    problemes: problemes || null,
    decisions: decisions || null,
    observations: observations || null,
    redige_par: parseInt(session.user.id, 10),
  });

  return createdResponse({ message: 'Journal créé avec succès', id_journal: journal.id_journal });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
