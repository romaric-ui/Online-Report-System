import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ouvrierRepo } from '../../../../lib/repositories/ouvrier.repository.js';
import { apiHandler, successResponse, createdResponse } from '../../../../lib/api-response.js';
import { requireTenant } from '../../../../lib/tenant.js';
import { AuthenticationError, ValidationError } from '../../../../lib/errors/index.js';

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

  const ouvriers = await ouvrierRepo.findByEntreprise(entrepriseId, { page, limit, search, statut });
  return successResponse(ouvriers);
}

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  const body = await request.json();
  const { nom, prenom, telephone, poste, specialite, taux_horaire, date_embauche } = body;

  if (!nom || !prenom) {
    throw new ValidationError('Le nom et le prénom sont requis');
  }

  const ouvrier = await ouvrierRepo.create({
    id_entreprise: entrepriseId,
    nom,
    prenom,
    telephone: telephone || null,
    poste: poste || null,
    specialite: specialite || null,
    taux_horaire: taux_horaire || null,
    date_embauche: date_embauche || null,
  });

  return createdResponse({ message: 'Ouvrier créé avec succès', id_ouvrier: ouvrier.id_ouvrier });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
