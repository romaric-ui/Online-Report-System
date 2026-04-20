import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { ouvrierRepo } from '../../../../../../lib/repositories/ouvrier.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { apiHandler, successResponse, createdResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';
import { checkFeature } from '../../../../../../lib/plan-guard.js';
import { connectDB } from '../../../../../../lib/database.js';

async function parseChantierId(params) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (!id || Number.isNaN(id) || id <= 0) {
    throw new ValidationError('ID chantier invalide');
  }
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
  await checkFeature(entrepriseId, 'equipes');
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const ouvriers = await ouvrierRepo.findByChantier(chantierId);
  return successResponse(ouvriers);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_ouvrier, date_debut, role_chantier } = body;

  if (!id_ouvrier || !date_debut) {
    throw new ValidationError("L'ID ouvrier et la date de début sont requis");
  }

  // Vérifier que l'ouvrier appartient à la même entreprise
  const ouvrier = await ouvrierRepo.findById(parseInt(id_ouvrier, 10));
  if (parseInt(ouvrier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError("Cet ouvrier n'appartient pas à votre entreprise");
  }

  const db = await connectDB();
  const [result] = await db.query(
    `INSERT INTO AffectationChantier (id_chantier, id_ouvrier, date_debut, role_chantier)
     VALUES (?, ?, ?, ?)`,
    [chantierId, parseInt(id_ouvrier, 10), date_debut, role_chantier || null]
  );

  return createdResponse({ message: 'Ouvrier affecté avec succès', id_affectation: result.insertId });
}

async function handleDELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const idAffectation = parseInt(searchParams.get('id_affectation'), 10);
  if (!idAffectation || Number.isNaN(idAffectation)) {
    throw new ValidationError('id_affectation requis');
  }

  const db = await connectDB();
  const [result] = await db.query(
    'DELETE FROM AffectationChantier WHERE id_affectation = ? AND id_chantier = ?',
    [idAffectation, chantierId]
  );

  if (result.affectedRows === 0) {
    throw new ValidationError('Affectation introuvable');
  }

  return successResponse({ message: 'Ouvrier retiré du chantier avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const DELETE = apiHandler(handleDELETE);
