import { invitationRepo } from '../../../../../lib/repositories/invitation.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { ValidationError, NotFoundError } from '../../../../../lib/errors/index.js';
import { connectDB } from '../../../../../lib/database.js';
import bcrypt from 'bcryptjs';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function parseCode(params) {
  const resolved = await params;
  const code = resolved.code?.trim();
  if (!code) throw new ValidationError('Code invalide');
  return code;
}

// GET — infos publiques de l'invitation (pas d'auth requise)
async function handleGET(request, { params }) {
  const code = await parseCode(params);

  await invitationRepo.expire();
  const invitation = await invitationRepo.findByCode(code);
  if (!invitation) throw new NotFoundError('Invitation introuvable');
  if (invitation.statut === 'acceptee')  throw new ValidationError('Cette invitation a déjà été acceptée');
  if (invitation.statut === 'annulee')   throw new ValidationError('Cette invitation a été annulée');
  if (invitation.statut === 'expiree')   throw new ValidationError('Cette invitation a expiré');

  return successResponse({
    email:           invitation.email,
    entreprise_nom:  invitation.entreprise_nom,
    role_nom:        invitation.role_nom,
    role_description: invitation.role_description,
    date_expiration: invitation.date_expiration,
  });
}

// POST — accepter l'invitation
async function handlePOST(request, { params }) {
  const code = await parseCode(params);

  await invitationRepo.expire();
  const invitation = await invitationRepo.findByCode(code);
  if (!invitation) throw new NotFoundError('Invitation introuvable');
  if (invitation.statut !== 'en_attente') {
    throw new ValidationError(`Invitation ${invitation.statut} — impossible de l'accepter`);
  }
  if (new Date(invitation.date_expiration) < new Date()) {
    throw new ValidationError('Cette invitation a expiré');
  }

  const body = await request.json();
  const db   = await connectDB();

  if (body.id_utilisateur) {
    // ── Cas 1 : utilisateur existant ──
    const userId = parseInt(body.id_utilisateur, 10);
    const [userRows] = await db.query(
      'SELECT id_utilisateur, email FROM Utilisateur WHERE id_utilisateur = ? LIMIT 1',
      [userId]
    );
    if (!userRows.length) throw new NotFoundError('Utilisateur introuvable');
    if (userRows[0].email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ValidationError('Cet email ne correspond pas à l\'invitation');
    }
    await db.query(
      'UPDATE Utilisateur SET id_entreprise = ?, id_role_entreprise = ? WHERE id_utilisateur = ?',
      [invitation.id_entreprise, invitation.role_attribue, userId]
    );
  } else {
    // ── Cas 2 : créer un nouveau compte ──
    const { nom, prenom, mot_de_passe } = body;
    const email = body.email?.trim()?.toLowerCase();

    if (!nom || !prenom || !email || !mot_de_passe) {
      throw new ValidationError('nom, prenom, email et mot_de_passe sont requis');
    }
    if (email !== invitation.email.toLowerCase()) {
      throw new ValidationError('Cet email ne correspond pas à l\'invitation');
    }
    if (mot_de_passe.length < 8) {
      throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Vérifier que l'email n'existe pas déjà
    const [existingRows] = await db.query(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ? LIMIT 1',
      [email]
    );
    if (existingRows.length) {
      throw new ValidationError('Un compte existe déjà avec cet email. Connectez-vous et acceptez l\'invitation.');
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);
    await db.query(
      `INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_entreprise, id_role_entreprise, id_role)
       VALUES (?, ?, ?, ?, ?, ?, 2)`,
      [nom.trim(), prenom.trim(), email, hash, invitation.id_entreprise, invitation.role_attribue]
    );
  }

  // Marquer l'invitation comme acceptée
  await invitationRepo.update(invitation.id_invitation, { statut: 'acceptee' });

  return successResponse({ message: 'Invitation acceptée avec succès' });
}

export const GET  = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
