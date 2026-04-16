import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { ouvrierRepo } from '../../../../../lib/repositories/ouvrier.repository.js';
import { apiHandler, successResponse } from '../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../lib/errors/index.js';

async function parseOuvrierId(params) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (!id || Number.isNaN(id) || id <= 0) {
    throw new ValidationError('ID ouvrier invalide');
  }
  return id;
}

async function verifyOuvrierEntreprise(ouvrierId, entrepriseId) {
  const ouvrier = await ouvrierRepo.findById(ouvrierId);
  if (parseInt(ouvrier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour cet ouvrier');
  }
  return ouvrier;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const ouvrierId = await parseOuvrierId(params);
  const ouvrier = await verifyOuvrierEntreprise(ouvrierId, entrepriseId);

  return successResponse(ouvrier);
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const ouvrierId = await parseOuvrierId(params);
  await verifyOuvrierEntreprise(ouvrierId, entrepriseId);

  const body = await request.json();
  const updatableFields = ['nom', 'prenom', 'telephone', 'poste', 'specialite', 'taux_horaire', 'statut', 'photo_url', 'date_embauche'];

  const sanitizedData = {};
  updatableFields.forEach((key) => {
    if (body[key] !== undefined) {
      sanitizedData[key] = body[key] === '' ? null : body[key];
    }
  });

  if (Object.keys(sanitizedData).length === 0) {
    throw new ValidationError('Aucune donnée valide à mettre à jour');
  }

  await ouvrierRepo.update(ouvrierId, sanitizedData);
  return successResponse({ message: 'Ouvrier modifié avec succès' });
}

async function handleDELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const ouvrierId = await parseOuvrierId(params);
  await verifyOuvrierEntreprise(ouvrierId, entrepriseId);

  await ouvrierRepo.delete(ouvrierId);
  return successResponse({ message: 'Ouvrier supprimé avec succès' });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
