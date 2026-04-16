import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { invitationRepo } from '../../../../../../lib/repositories/invitation.repository.js';
import { successResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

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

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // admin entreprise uniquement

  const resolved = await params;
  const invId = parseInt(resolved.code, 10);
  if (!invId || Number.isNaN(invId)) throw new ValidationError('ID invitation invalide');

  const invitation = await invitationRepo.findById(invId);
  if (parseInt(invitation.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé');
  }
  if (invitation.statut !== 'en_attente') {
    throw new ValidationError('Seules les invitations en attente peuvent être annulées');
  }

  await invitationRepo.update(invId, { statut: 'annulee' });
  return successResponse({ message: 'Invitation annulée' });
}

export const PUT = apiHandler(handlePUT);
