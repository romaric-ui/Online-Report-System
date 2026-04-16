import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError, ConflictError } from '../../../../../lib/errors/index.js';
import { validateEmail, validatePassword, validateName } from '../../../../../lib/security';
import bcrypt from 'bcryptjs';

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
  const admins = await userRepo.raw(
    `SELECT id_utilisateur as id, nom, prenom, email, provider, date_creation, derniere_connexion, statut
     FROM Utilisateur
     WHERE id_role = 1
     ORDER BY date_creation DESC`,
    []
  );
  return successResponse({ admins });
}

async function handlePOST(request) {
  await requireAdmin();
  const body = await request.json();
  const { nom, prenom, email, password, role } = body;

  if (!nom || !prenom || !email || !password) {
    throw new ValidationError('Tous les champs sont obligatoires (nom, prénom, email, mot de passe)');
  }

  if (role && !['admin', 'user'].includes(role)) {
    throw new ValidationError('Rôle invalide');
  }

  const idRole = role === 'user' ? 2 : 1;
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ValidationError(emailValidation.error);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.error);
  }

  const nomValidation = validateName(nom, 'Nom');
  if (!nomValidation.isValid) {
    throw new ValidationError(nomValidation.error);
  }

  const prenomValidation = validateName(prenom, 'Prénom');
  if (!prenomValidation.isValid) {
    throw new ValidationError(prenomValidation.error);
  }

  const existing = await userRepo.findByEmail(emailValidation.value);
  if (existing) {
    throw new ConflictError('Un compte avec cet email existe déjà');
  }

  const hashedPassword = await bcrypt.hash(passwordValidation.value, 12);
  const createdAdmin = await userRepo.createLocalUser({
    nom: nomValidation.value,
    prenom: prenomValidation.value,
    email: emailValidation.value,
    mot_de_passe: hashedPassword,
    id_role: idRole,
    email_verified: 1,
    statut: 'actif'
  });

  const isAdmin = idRole === 1;
  return createdResponse({
    success: true,
    message: isAdmin ? 'Compte administrateur créé avec succès' : 'Compte utilisateur créé avec succès',
    admin: {
      id: createdAdmin.id_utilisateur,
      nom: nomValidation.value,
      prenom: prenomValidation.value,
      email: emailValidation.value,
      role: isAdmin ? 'admin' : 'user'
    }
  });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
