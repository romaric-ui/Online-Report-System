import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { errorResponse } from '../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../lib/errors/index.js';
import { generateChantierExport, AVAILABLE_MODULES } from '../../../../lib/export-service.js';

const apiHandler = (handler) => async (request, context) => {
  try { return await handler(request, context); }
  catch (error) { return errorResponse(error, request); }
};

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');
  if (!session.user.entrepriseId) throw new AuthorizationError('Export réservé aux comptes entreprise');

  const { searchParams } = new URL(request.url);

  // ── Validation params ──────────────────────────
  const chantierId = parseInt(searchParams.get('chantier_id'), 10);
  if (!chantierId || Number.isNaN(chantierId)) {
    throw new ValidationError('chantier_id requis');
  }

  const modulesParam = searchParams.get('modules') || '';
  const modules = modulesParam.split(',').filter((m) => AVAILABLE_MODULES.includes(m));
  if (modules.length === 0) {
    throw new ValidationError(`Au moins un module parmi : ${AVAILABLE_MODULES.join(', ')}`);
  }

  const dateDebut = searchParams.get('date_debut') || null; // YYYY-MM-DD
  const dateFin   = searchParams.get('date_fin')   || null;

  // ── Génération Excel ──────────────────────────
  const { workbook, chantierNom } = await generateChantierExport({
    chantierId,
    modules,
    dateDebut,
    dateFin,
  });

  const buffer = await workbook.xlsx.writeBuffer();

  // Nom de fichier lisible, sans caractères spéciaux
  const safeName = chantierNom.replace(/[^a-zA-Z0-9À-ÿ _-]/g, '').substring(0, 50);
  const dateStr  = new Date().toISOString().split('T')[0];
  const filename = `Export_${safeName}_${dateStr}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export const GET = apiHandler(handleGET);