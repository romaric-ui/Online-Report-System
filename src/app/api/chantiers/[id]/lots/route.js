import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { BaseRepository } from '../../../../../../lib/repositories/base.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

const lotRepo = new BaseRepository('Lot', 'id_lot');

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
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const lots = await lotRepo.findAll({ where: 'id_chantier = ?', params: [chantierId] });
  return successResponse(lots);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { nom, description, ordre } = body;

  if (!nom) {
    throw new ValidationError('Le nom du lot est requis');
  }

  const lot = await lotRepo.create({
    id_chantier: chantierId,
    nom,
    description: description || null,
    ordre: ordre !== undefined ? parseInt(ordre, 10) : 0,
  });

  return createdResponse({ message: 'Lot créé avec succès', id_lot: lot.id_lot });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
