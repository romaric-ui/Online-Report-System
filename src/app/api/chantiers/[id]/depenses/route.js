import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { depenseRepo } from '../../../../../../lib/repositories/depense.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { apiHandler, successResponse, createdResponse } from '../../../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

async function parseChantierId(params) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
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
  requireRole(session, [1, 2, 3]); // admin + chef de chantier + conducteur de travaux
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const limit = parsePositiveInt(searchParams.get('limit'), 20);
  const categorie = searchParams.get('categorie') || undefined;
  const statut = searchParams.get('statut') || undefined;

  const depenses = await depenseRepo.findByChantier(chantierId, { page, limit, categorie, statut });
  return successResponse(depenses);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1, 2, 3]); // admin + chef de chantier + conducteur de travaux
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { libelle, montant, date_depense, categorie, fournisseur, notes } = body;

  if (!libelle || !montant || !date_depense || !categorie) {
    throw new ValidationError('libelle, montant, date_depense et categorie sont requis');
  }

  const depense = await depenseRepo.create({
    id_chantier: chantierId,
    libelle,
    montant: parseFloat(montant),
    date_depense,
    categorie,
    fournisseur: fournisseur || null,
    notes: notes || null,
    cree_par: parseInt(session.user.id, 10),
  });

  return createdResponse({ message: 'Dépense ajoutée avec succès', id_depense: depense.id_depense });
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // validation de dépense : admin entreprise uniquement
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_depense, statut } = body;

  if (!id_depense) throw new ValidationError('id_depense est requis');
  if (!['validee', 'rejetee'].includes(statut)) {
    throw new ValidationError('statut doit être "validee" ou "rejetee"');
  }

  await depenseRepo.update(parseInt(id_depense, 10), {
    statut,
    valide_par: parseInt(session.user.id, 10),
  });

  return successResponse({ message: 'Dépense mise à jour avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
