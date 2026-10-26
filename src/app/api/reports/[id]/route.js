import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { reportRepo } from '../../../../../lib/repositories/report.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../lib/errors/index.js';

const ALLOWED_COLUMNS = new Set([
  'numero_affaire', 'numero_rapport', 'nom_chantier', 'adresse_chantier',
  'date_visite', 'phase', 'equipe_presente', 'materiel_utilise',
  'objectifs_limites', 'deroulement', 'investigation', 'autres_points',
  'conclusion', 'photo_couverture', 'statut', 'titre', 'description',
]);

function parseReportId(params) {
  const { id } = params;
  const reportId = parseInt(id, 10);
  if (!reportId || Number.isNaN(reportId) || reportId <= 0) {
    throw new ValidationError('ID invalide');
  }
  return reportId;
}

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const resolvedParams = await params;
  const reportId = parseReportId(resolvedParams);
  const report = await reportRepo.findById(reportId);
  if (report.id_utilisateur !== parseInt(session.user.id, 10)) {
    throw new AuthorizationError('Non autorisé');
  }

  const body = await request.json();
  const updateData = body;

  const safeFields = Object.keys(updateData).filter((key) => ALLOWED_COLUMNS.has(key));
  if (safeFields.length === 0) throw new ValidationError('Aucune donnée valide à mettre à jour');

  const sanitizedData = {};
  safeFields.forEach((field) => {
    sanitizedData[field] = typeof updateData[field] === 'object'
      ? JSON.stringify(updateData[field])
      : updateData[field];
  });

  await reportRepo.update(reportId, sanitizedData);
  return successResponse({ message: 'Rapport modifié avec succès' });
}

async function handleDELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const resolvedParams = await params;
  const reportId = parseReportId(resolvedParams);
  const report = await reportRepo.findById(reportId);
  if (report.id_utilisateur !== parseInt(session.user.id, 10)) {
    throw new AuthorizationError('Non autorisé');
  }

  await reportRepo.delete(reportId);

  // ✅ Aucune décrémentation — COUNT dynamique dans checkLimiteParticulier fait foi

  return successResponse({ message: 'Rapport supprimé avec succès' });
}

export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);