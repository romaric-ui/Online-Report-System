import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { materielRepo } from '../../../../../lib/repositories/materiel.repository.js';
import { apiHandler, successResponse } from '../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../lib/errors/index.js';

async function parseMaterielId(params) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (!id || Number.isNaN(id) || id <= 0) throw new ValidationError('ID matériel invalide');
  return id;
}

async function verifyMaterielEntreprise(materielId, entrepriseId) {
  const item = await materielRepo.findById(materielId);
  if (parseInt(item.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce matériel');
  }
  return item;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const materielId = await parseMaterielId(params);
  const item = await verifyMaterielEntreprise(materielId, entrepriseId);
  return successResponse(item);
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const materielId = await parseMaterielId(params);
  await verifyMaterielEntreprise(materielId, entrepriseId);

  const body = await request.json();
  const updatableFields = [
    'nom', 'categorie', 'reference', 'numero_serie', 'marque', 'etat',
    'date_achat', 'prix_achat', 'date_prochaine_maintenance', 'localisation', 'notes',
  ];

  const sanitizedData = {};
  updatableFields.forEach((key) => {
    if (body[key] !== undefined) {
      sanitizedData[key] = body[key] === '' ? null : body[key];
    }
  });

  if (Object.keys(sanitizedData).length === 0) throw new ValidationError('Aucune donnée valide à mettre à jour');

  await materielRepo.update(materielId, sanitizedData);
  return successResponse({ message: 'Matériel modifié avec succès' });
}

async function handleDELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const materielId = await parseMaterielId(params);
  await verifyMaterielEntreprise(materielId, entrepriseId);

  await materielRepo.delete(materielId);
  return successResponse({ message: 'Matériel supprimé avec succès' });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
