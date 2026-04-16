import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { userRepo } from '../../../../../../lib/repositories/user.repository.js';
import { successResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError } from '../../../../../../lib/errors/index.js';
import { validateId } from '../../../../../../lib/security';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    throw new AuthorizationError('Non autorisé');
  }
  return session;
}

async function handlePUT(request, { params }) {
  const session = await requireAdmin();
  const { id } = params;
  const idValidation = validateId(id, 'ID utilisateur');
  if (!idValidation.isValid) {
    throw new ValidationError(idValidation.error);
  }

  const body = await request.json();
  const { action } = body;

  if (!action || !['block', 'unblock'].includes(action)) {
    throw new ValidationError('Action invalide');
  }

  if (parseInt(session.user.id, 10) === idValidation.value) {
    throw new ValidationError('Vous ne pouvez pas modifier votre propre compte');
  }

  await userRepo.findById(idValidation.value);

  if (action === 'block') {
    await userRepo.blockUser(idValidation.value);
    return successResponse({ message: 'Utilisateur bloqué avec succès' });
  }

  await userRepo.unblockUser(idValidation.value);
  return successResponse({ message: 'Utilisateur débloqué avec succès' });
}

async function handleDELETE(request, { params }) {
  const session = await requireAdmin();
  const { id } = params;
  const idValidation = validateId(id, 'ID utilisateur');
  if (!idValidation.isValid) {
    throw new ValidationError(idValidation.error);
  }

  if (parseInt(session.user.id, 10) === idValidation.value) {
    throw new ValidationError('Vous ne pouvez pas supprimer votre propre compte');
  }

  await userRepo.findById(idValidation.value);
  await userRepo.raw('DELETE FROM Rapport WHERE id_utilisateur = ?', [idValidation.value]);
  await userRepo.delete(idValidation.value);

  return successResponse({ message: 'Utilisateur supprimé avec succès' });
}

export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
