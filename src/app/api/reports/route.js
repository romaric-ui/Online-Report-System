import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { reportRepo } from '../../../../lib/repositories/report.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function handleGET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Non authentifié');
  }

  const reports = await reportRepo.raw(
    `SELECT 
      r.*,
      u.nom AS createur_nom,
      u.prenom AS createur_prenom
    FROM Rapport r
    JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
    WHERE r.id_utilisateur = ?
    ORDER BY r.date_creation DESC`,
    [session.user.id]
  );

  return successResponse(reports);
}

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Non authentifié');
  }

  const body = await request.json();
  const {
    numero_affaire,
    numero_rapport,
    nom_chantier,
    adresse_chantier,
    date_visite,
    phase,
    equipe_presente,
    materiel_utilise,
    objectifs_limites,
    deroulement,
    investigation,
    autres_points,
    conclusion,
    photo_couverture,
  } = body;

  if (!numero_affaire || !numero_rapport || !nom_chantier) {
    throw new ValidationError('Champs obligatoires manquants');
  }

  const report = await reportRepo.create({
    id_utilisateur: session.user.id,
    numero_affaire,
    numero_rapport,
    nom_chantier,
    adresse_chantier: adresse_chantier || null,
    date_visite: date_visite || new Date().toISOString().split('T')[0],
    phase: phase || 'Réservé',
    equipe_presente: equipe_presente ? JSON.stringify(equipe_presente) : null,
    materiel_utilise: materiel_utilise ? JSON.stringify(materiel_utilise) : null,
    objectifs_limites: objectifs_limites || null,
    deroulement: deroulement || null,
    investigation: investigation ? JSON.stringify(investigation) : null,
    autres_points: autres_points ? JSON.stringify(autres_points) : null,
    conclusion: conclusion || null,
    photo_couverture: photo_couverture || null,
    statut: 'en_attente',
  });

  return createdResponse({ message: 'Rapport créé avec succès', id_rapport: report.id_rapport });
}

async function handlePUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Non authentifié');
  }

  const body = await request.json();
  const { id_rapport, ...updateData } = body;

  if (!id_rapport) {
    throw new ValidationError('ID rapport manquant');
  }

  const report = await reportRepo.findById(id_rapport);
  if (report.id_utilisateur !== parseInt(session.user.id, 10)) {
    throw new AuthorizationError('Non autorisé à modifier ce rapport');
  }

  const ALLOWED_COLUMNS = new Set([
    'numero_affaire', 'numero_rapport', 'nom_chantier', 'adresse_chantier',
    'date_visite', 'phase', 'equipe_presente', 'materiel_utilise',
    'objectifs_limites', 'deroulement', 'investigation', 'autres_points',
    'conclusion', 'photo_couverture', 'statut', 'titre', 'description',
  ]);

  const fields = Object.keys(updateData).filter(
    (key) => updateData[key] !== undefined && ALLOWED_COLUMNS.has(key)
  );

  if (fields.length === 0) {
    throw new ValidationError('Aucune donnée valide à mettre à jour');
  }

  const sanitizedData = {};
  fields.forEach((field) => {
    sanitizedData[field] = typeof updateData[field] === 'object'
      ? JSON.stringify(updateData[field])
      : updateData[field];
  });

  await reportRepo.update(id_rapport, sanitizedData);

  return successResponse({ message: 'Rapport modifié avec succès' });
}

async function handleDELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Non authentifié');
  }

  const { searchParams } = new URL(request.url);
  const id_rapport = searchParams.get('id');

  if (!id_rapport) {
    throw new ValidationError('ID rapport manquant');
  }

  const report = await reportRepo.findById(id_rapport);
  if (report.id_utilisateur !== parseInt(session.user.id, 10)) {
    throw new AuthorizationError('Non autorisé à supprimer ce rapport');
  }

  await reportRepo.delete(id_rapport);

  return successResponse({ message: 'Rapport supprimé avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
