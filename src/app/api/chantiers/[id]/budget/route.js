import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { budgetRepo } from '../../../../../../lib/repositories/budget.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { apiHandler, successResponse, createdResponse } from '../../../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

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

  const synthese = await budgetRepo.getSynthese(chantierId);
  return successResponse(synthese);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // admin entreprise uniquement
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { budget_total, devise } = body;

  if (!budget_total || isNaN(parseFloat(budget_total))) {
    throw new ValidationError('Le budget total est requis et doit être un nombre');
  }

  const existing = await budgetRepo.findByChantier(chantierId);
  if (existing) throw new ValidationError('Un budget existe déjà pour ce chantier. Utilisez PUT pour le modifier.');

  const budget = await budgetRepo.create({
    id_chantier: chantierId,
    budget_total: parseFloat(budget_total),
    devise: devise || 'XOF',
  });

  return createdResponse({ message: 'Budget créé avec succès', id_budget: budget.id_budget });
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // admin entreprise uniquement
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { budget_total, devise } = body;

  if (!budget_total || isNaN(parseFloat(budget_total))) {
    throw new ValidationError('Le budget total est requis et doit être un nombre');
  }

  const existing = await budgetRepo.findByChantier(chantierId);
  if (!existing) throw new ValidationError('Aucun budget défini pour ce chantier. Utilisez POST pour en créer un.');

  await budgetRepo.update(existing.id_budget, {
    budget_total: parseFloat(budget_total),
    ...(devise ? { devise } : {}),
  });

  return successResponse({ message: 'Budget modifié avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
