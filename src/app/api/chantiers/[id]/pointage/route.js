import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { pointageRepo } from '../../../../../../lib/repositories/pointage.repository.js';
import { ouvrierRepo } from '../../../../../../lib/repositories/ouvrier.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { apiHandler, successResponse, createdResponse } from '../../../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

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

function calculateHeures(heureArrivee, heureDepart) {
  if (!heureArrivee || !heureDepart) return null;
  const [hA, mA] = heureArrivee.split(':').map(Number);
  const [hD, mD] = heureDepart.split(':').map(Number);
  const totalMinutes = (hD * 60 + mD) - (hA * 60 + mA);
  if (totalMinutes <= 0) return null;
  return parseFloat((totalMinutes / 60).toFixed(2));
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [2, 3]); // chef de chantier + conducteur de travaux
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || todayDate();

  const pointages = await pointageRepo.findByChantierAndDate(chantierId, date);
  return successResponse(pointages);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [2, 3]); // chef de chantier + conducteur de travaux
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const {
    id_ouvrier,
    date_pointage,
    heure_arrivee,
    heure_depart,
    statut,
    note,
  } = body;

  if (!id_ouvrier) {
    throw new ValidationError("L'ID ouvrier est requis");
  }

  // Vérifier que l'ouvrier appartient à la même entreprise
  const ouvrier = await ouvrierRepo.findById(parseInt(id_ouvrier, 10));
  if (parseInt(ouvrier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError("Cet ouvrier n'appartient pas à votre entreprise");
  }

  const heures_travaillees = calculateHeures(heure_arrivee, heure_depart);

  const pointage = await pointageRepo.create({
    id_ouvrier: parseInt(id_ouvrier, 10),
    id_chantier: chantierId,
    date_pointage: date_pointage || todayDate(),
    heure_arrivee: heure_arrivee || null,
    heure_depart: heure_depart || null,
    heures_travaillees,
    statut: statut || 'present',
    note: note || null,
    pointe_par: parseInt(session.user.id, 10),
  });

  return createdResponse({ message: 'Pointage enregistré avec succès', id_pointage: pointage.id_pointage });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
