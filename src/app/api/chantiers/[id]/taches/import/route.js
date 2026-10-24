import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/options';
import { errorResponse, successResponse } from '../../../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../../lib/errors/index.js';
import { requireTenant, requireRole } from '../../../../../../../lib/tenant.js';
import { chantierRepo } from '../../../../../../../lib/repositories/chantier.repository.js';
import { generateImportTemplate, parseImportFile, importTaches } from '../../../../../../../lib/import-taches-service.js';

const apiHandler = (handler) => async (request, context) => {
  try { return await handler(request, context); }
  catch (error) { return errorResponse(error, request); }
};

// Vérifie la session, le tenant et l'appartenance du chantier à l'entreprise
async function authorizeChantier(params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');
  const entrepriseId = requireTenant(session);

  const resolvedParams = await params;
  const chantierId = parseInt(resolvedParams.id, 10);
  if (!chantierId || Number.isNaN(chantierId) || chantierId <= 0) {
    throw new ValidationError('ID chantier invalide');
  }

  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }
  return { session, chantierId };
}

// GET — Télécharger le template Excel (pré-rempli avec les lots du chantier)
async function handleGET(request, { params }) {
  const { chantierId } = await authorizeChantier(params);

  const workbook = await generateImportTemplate(chantierId);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="PROJECTRA_template_taches.xlsx"',
    },
  });
}

// POST — Importer un fichier Excel/CSV
async function handlePOST(request, { params }) {
  const { session, chantierId } = await authorizeChantier(params);
  requireRole(session, [1, 2]); // admin entreprise + chef de chantier (comme la création unitaire)

  // Récupérer le fichier
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    throw new ValidationError('Fichier manquant');
  }

  const filename = file.name || 'import.xlsx';
  const ext = filename.split('.').pop().toLowerCase();

  if (!['xlsx', 'csv', 'tsv'].includes(ext)) {
    throw new ValidationError('Format accepté : .xlsx, .csv ou .tsv');
  }

  // Lire le buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Parser le fichier
  const parsedRows = await parseImportFile(buffer, filename);

  if (parsedRows.length === 0) {
    throw new ValidationError('Fichier vide ou aucune ligne de données trouvée');
  }

  // Importer les tâches
  const result = await importTaches(chantierId, parsedRows);

  return successResponse({
    message: `${result.created} tâche(s) créée(s) sur ${result.total} ligne(s)`,
    total: result.total,
    created: result.created,
    skipped: result.skipped,
    errors: result.errors,
  });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
