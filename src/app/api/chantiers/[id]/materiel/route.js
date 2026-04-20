import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { materielRepo } from '../../../../../../lib/repositories/materiel.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { apiHandler, successResponse, createdResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';
import { checkFeature } from '../../../../../../lib/plan-guard.js';
import { connectDB } from '../../../../../../lib/database.js';

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
  await checkFeature(entrepriseId, 'materiel');
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const materiel = await materielRepo.findByChantier(chantierId);
  return successResponse(materiel);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_materiel, date_sortie, date_retour_prevue, etat_sortie } = body;

  if (!id_materiel || !date_sortie) throw new ValidationError("L'ID matériel et la date de sortie sont requis");

  const item = await materielRepo.findById(parseInt(id_materiel, 10));
  if (parseInt(item.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError("Ce matériel n'appartient pas à votre entreprise");
  }

  const db = await connectDB();
  const [result] = await db.query(
    `INSERT INTO AffectationMateriel (id_materiel, id_chantier, date_sortie, date_retour_prevue, etat_sortie, sorti_par)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      parseInt(id_materiel, 10),
      chantierId,
      date_sortie,
      date_retour_prevue || null,
      etat_sortie || null,
      parseInt(session.user.id, 10),
    ]
  );

  return createdResponse({ message: 'Matériel affecté avec succès', id_affectation: result.insertId });
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_affectation, date_retour, etat_retour } = body;

  if (!id_affectation) throw new ValidationError("L'ID affectation est requis");

  const db = await connectDB();
  const [result] = await db.query(
    `UPDATE AffectationMateriel
     SET date_retour = ?, etat_retour = ?
     WHERE id_affectation = ? AND id_chantier = ?`,
    [date_retour || new Date().toISOString().slice(0, 10), etat_retour || null, parseInt(id_affectation, 10), chantierId]
  );

  if (result.affectedRows === 0) throw new ValidationError('Affectation introuvable');

  return successResponse({ message: 'Retour du matériel enregistré avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
