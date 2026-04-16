import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { materielRepo } from '../../../../lib/repositories/materiel.repository.js';
import { apiHandler, successResponse, createdResponse } from '../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../lib/tenant.js';
import { AuthenticationError, ValidationError } from '../../../../lib/errors/index.js';

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const limit = parsePositiveInt(searchParams.get('limit'), 20);
  const search = searchParams.get('search') || undefined;
  const categorie = searchParams.get('categorie') || undefined;
  const etat = searchParams.get('etat') || undefined;

  const materiel = await materielRepo.findByEntreprise(entrepriseId, { page, limit, search, categorie, etat });
  return successResponse(materiel);
}

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // admin entreprise uniquement
  const body = await request.json();
  const {
    nom, categorie, reference, numero_serie, marque, etat,
    date_achat, prix_achat, date_prochaine_maintenance, localisation, notes,
  } = body;

  if (!nom || !categorie) throw new ValidationError('Le nom et la catégorie sont requis');

  const item = await materielRepo.create({
    id_entreprise: entrepriseId,
    nom,
    categorie,
    reference: reference || null,
    numero_serie: numero_serie || null,
    marque: marque || null,
    etat: etat || 'bon',
    date_achat: date_achat || null,
    prix_achat: prix_achat || null,
    date_prochaine_maintenance: date_prochaine_maintenance || null,
    localisation: localisation || null,
    notes: notes || null,
  });

  return createdResponse({ message: 'Matériel ajouté avec succès', id_materiel: item.id_materiel });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
