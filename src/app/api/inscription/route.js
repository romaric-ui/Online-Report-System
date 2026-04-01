import bcrypt from 'bcryptjs';
import { userRepo } from '../../../../lib/repositories/user.repository.js';
import { createdResponse, errorResponse } from '../../../../lib/api-response.js';
import { ValidationError, ConflictError } from '../../../../lib/errors/index.js';
import { validateEmail, validatePassword, validateName } from '../../../../lib/security.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

function sanitizeSlug(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `entreprise-${Date.now()}`;
}

async function generateUniqueSlug(name) {
  const baseSlug = sanitizeSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await userRepo.raw('SELECT id_entreprise FROM Entreprise WHERE slug = ?', [slug]);
    if (!existing.length) {
      return slug;
    }
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

async function handlePOST(request) {
  const body = await request.json();
  const entreprise = body.entreprise || {};
  const admin = body.admin || {};

  const entrepriseNom = entreprise.nom;
  const entreprisePays = entreprise.pays || 'Bénin';
  const entrepriseTelephone = entreprise.telephone || null;
  const entrepriseEmailContact = entreprise.email_contact || null;

  const adminNom = admin.nom;
  const adminPrenom = admin.prenom;
  const adminEmail = admin.email;
  const adminMotDePasse = admin.mot_de_passe;

  if (!entrepriseNom || !adminNom || !adminPrenom || !adminEmail || !adminMotDePasse) {
    throw new ValidationError('Tous les champs obligatoires doivent être remplis');
  }

  const entrepriseNomValidation = validateName(entrepriseNom, 'Nom de l\'entreprise');
  if (!entrepriseNomValidation.isValid) {
    throw new ValidationError(entrepriseNomValidation.error);
  }

  const nomValidation = validateName(adminNom, 'Nom');
  if (!nomValidation.isValid) {
    throw new ValidationError(nomValidation.error);
  }

  const prenomValidation = validateName(adminPrenom, 'Prénom');
  if (!prenomValidation.isValid) {
    throw new ValidationError(prenomValidation.error);
  }

  const emailValidation = validateEmail(adminEmail);
  if (!emailValidation.isValid) {
    throw new ValidationError(emailValidation.error);
  }

  const passwordValidation = validatePassword(adminMotDePasse);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.error);
  }

  const existingUser = await userRepo.findByEmail(emailValidation.value);
  if (existingUser) {
    throw new ConflictError('Un compte avec cet email existe déjà');
  }

  const slug = await generateUniqueSlug(entrepriseNomValidation.value);

  let createdEntreprise;
  let createdAdmin;

  await userRepo.transaction(async (connection) => {
    const [enterpriseResult] = await connection.query(
      'INSERT INTO Entreprise (nom, slug, pays, telephone, email_contact) VALUES (?, ?, ?, ?, ?)',
      [entrepriseNomValidation.value, slug, entreprisePays, entrepriseTelephone, entrepriseEmailContact]
    );

    const entrepriseId = enterpriseResult.insertId;
    const hashedPassword = await bcrypt.hash(passwordValidation.value, 12);

    const [adminResult] = await connection.query(
      `INSERT INTO Utilisateur
       (nom, prenom, email, mot_de_passe, provider, provider_id, id_role, statut, email_verified, id_entreprise)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nomValidation.value,
        prenomValidation.value,
        emailValidation.value,
        hashedPassword,
        'credentials',
        null,
        1,
        'actif',
        1,
        entrepriseId
      ]
    );

    createdEntreprise = {
      id_entreprise: entrepriseId,
      nom: entrepriseNomValidation.value,
      slug,
      pays: entreprisePays,
      telephone: entrepriseTelephone,
      email_contact: entrepriseEmailContact
    };

    createdAdmin = {
      id_utilisateur: adminResult.insertId,
      nom: nomValidation.value,
      prenom: prenomValidation.value,
      email: emailValidation.value,
      id_role: 1,
      id_entreprise: entrepriseId
    };
  });

  return createdResponse({ entreprise: createdEntreprise, admin: createdAdmin });
}

export const POST = apiHandler(handlePOST);
