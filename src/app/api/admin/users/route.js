import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError, ConflictError } from '../../../../../lib/errors/index.js';
import { validateEmail, validateName, validateId } from '../../../../../lib/security';

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

async function handleGET() {
  await requireAdmin();
  const users = await userRepo.findAllWithRole({ page: 1, limit: 1000 });

  const normalizedUsers = users.map((u) => ({
    ...u,
    role: u.nom_role === 'Administrateur' ? 'admin' : 'user',
    status: u.statut === 'bloque' ? 'blocked' : 'active'
  }));

  return successResponse(normalizedUsers);
}

async function handlePUT(request) {
  await requireAdmin();
  const body = await request.json();
  const { id, nom, prenom, email } = body;

  const idValidation = validateId(id, 'ID utilisateur');
  if (!idValidation.isValid) {
    throw new ValidationError(idValidation.error);
  }

  const updates = {};

  if (nom !== undefined) {
    const nomValidation = validateName(nom, 'Nom');
    if (!nomValidation.isValid) {
      throw new ValidationError(nomValidation.error);
    }
    updates.nom = nomValidation.value;
  }

  if (prenom !== undefined) {
    const prenomValidation = validateName(prenom, 'Prénom');
    if (!prenomValidation.isValid) {
      throw new ValidationError(prenomValidation.error);
    }
    updates.prenom = prenomValidation.value;
  }

  if (email !== undefined) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new ValidationError(emailValidation.error);
    }
    const duplicate = await userRepo.findByEmail(emailValidation.value);
    if (duplicate && duplicate.id_utilisateur !== idValidation.value) {
      throw new ConflictError('Cet email est déjà utilisé');
    }
    updates.email = emailValidation.value;
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('Aucune donnée à modifier');
  }

  await userRepo.findById(idValidation.value);
  await userRepo.update(idValidation.value, updates);

  return successResponse({ message: 'Utilisateur modifié avec succès' });
}

async function handleDELETE(request) {
  const session = await requireAdmin();
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');

  const idValidation = validateId(rawId, 'ID utilisateur');
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

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
