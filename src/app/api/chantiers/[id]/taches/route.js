import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { tacheRepo } from '../../../../../../lib/repositories/tache.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

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

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get('statut') || undefined;
  const lotId = searchParams.get('lotId') ? parseInt(searchParams.get('lotId'), 10) : undefined;

  const taches = await tacheRepo.findByChantier(chantierId, { statut, lotId });
  return successResponse(taches);
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
  const {
    nom,
    description,
    date_debut,
    date_fin_prevue,
    statut,
    priorite,
    id_lot,
    assignee_a,
    pourcentage,
  } = body;

  if (!nom) {
    throw new ValidationError('Le nom de la tâche est requis');
  }

  if (date_debut && date_fin_prevue && date_fin_prevue < date_debut) {
    throw new ValidationError('La date de fin doit être supérieure ou égale à la date de début');
  }

  const tache = await tacheRepo.create({
    id_chantier: chantierId,
    id_lot: id_lot ? parseInt(id_lot, 10) : null,
    nom,
    description: description || null,
    pourcentage: pourcentage !== undefined ? pourcentage : 0,
    date_debut: date_debut || null,
    date_fin_prevue: date_fin_prevue || null,
    statut: statut || 'a_faire',
    priorite: priorite || 'normale',
    assignee_a: assignee_a ? parseInt(assignee_a, 10) : null,
  });

  await chantierRepo.updateProgression(chantierId);
  return createdResponse({ message: 'Tâche créée avec succès', id_tache: tache.id_tache });
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_tache } = body;
  if (!id_tache) {
    throw new ValidationError('ID tâche manquant');
  }

  const tache = await tacheRepo.findById(id_tache);
  if (parseInt(tache.id_chantier, 10) !== chantierId) {
    throw new AuthorizationError('Non autorisé pour cette tâche');
  }

  const updatableFields = [
    'nom', 'description', 'date_debut', 'date_fin_prevue', 'date_fin_reelle',
    'statut', 'priorite', 'id_lot', 'assignee_a', 'pourcentage'
  ];

  const sanitizedData = {};
  updatableFields.forEach((key) => {
    if (body[key] !== undefined) {
      sanitizedData[key] = body[key] === '' ? null : body[key];
    }
  });

  if (Object.keys(sanitizedData).length === 0) {
    throw new ValidationError('Aucune donnée valide à mettre à jour');
  }

  const mergedDebut     = sanitizedData.date_debut     !== undefined ? sanitizedData.date_debut     : tache.date_debut;
  const mergedFinPrevue = sanitizedData.date_fin_prevue !== undefined ? sanitizedData.date_fin_prevue : tache.date_fin_prevue;
  if (mergedDebut && mergedFinPrevue && mergedFinPrevue < mergedDebut) {
    throw new ValidationError('La date de fin doit être supérieure ou égale à la date de début');
  }

  await tacheRepo.update(id_tache, sanitizedData);

  if (sanitizedData.pourcentage !== undefined || sanitizedData.statut !== undefined) {
    await chantierRepo.updateProgression(chantierId);
  }

  return successResponse({ message: 'Tâche modifiée avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
