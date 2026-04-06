import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { invitationRepo } from '../../../../lib/repositories/invitation.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../lib/api-response.js';
import { requireTenant } from '../../../../lib/tenant.js';
import { sendInvitationEmail } from '../../../../lib/email-service.js';
import { AuthenticationError, AuthorizationError, ValidationError, ConflictError } from '../../../../lib/errors/index.js';
import { connectDB } from '../../../../lib/database.js';
import crypto from 'crypto';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function requireAdmin(session, entrepriseId) {
  const db = await connectDB();
  const userId = parseInt(session.user.id, 10);
  const eid    = parseInt(entrepriseId, 10);
  const [rows] = await db.query(
    `SELECT r.nom FROM Utilisateur u
     INNER JOIN RoleEntreprise r ON u.id_role_entreprise = r.id_role_entreprise
     WHERE u.id_utilisateur = ? AND u.id_entreprise = ?
     LIMIT 1`,
    [userId, eid]
  );
  if (!rows.length || rows[0].nom !== 'admin') {
    throw new AuthorizationError('Accès réservé aux administrateurs');
  }
}

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  await requireAdmin(session, entrepriseId);
  await invitationRepo.expire();

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get('statut') || null;

  const invitations = await invitationRepo.findByEntreprise(entrepriseId, { statut });
  return successResponse(invitations);
}

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  await requireAdmin(session, entrepriseId);

  const body = await request.json();
  const email = body.email?.trim()?.toLowerCase();
  if (!email) throw new ValidationError('Email requis');

  const id_role_entreprise = parseInt(body.id_role_entreprise, 10);
  if (!id_role_entreprise || Number.isNaN(id_role_entreprise)) {
    throw new ValidationError('Rôle requis');
  }

  const db = await connectDB();
  const eid = parseInt(entrepriseId, 10);

  // Vérifier que le rôle existe
  const [roleRows] = await db.query(
    'SELECT nom, description FROM RoleEntreprise WHERE id_role_entreprise = ? LIMIT 1',
    [id_role_entreprise]
  );
  if (!roleRows.length) throw new ValidationError('Rôle invalide');
  const role = roleRows[0];

  // Vérifier que l'email n'est pas déjà membre
  const [memberRows] = await db.query(
    'SELECT id_utilisateur FROM Utilisateur WHERE email = ? AND id_entreprise = ? LIMIT 1',
    [email, eid]
  );
  if (memberRows.length) throw new ConflictError('Cet utilisateur est déjà membre de l\'entreprise');

  // Vérifier pas d'invitation en attente
  const existing = await invitationRepo.findByEmail(email, eid);
  if (existing) throw new ConflictError('Une invitation est déjà en attente pour cet email');

  // Nom entreprise
  const [entRows] = await db.query(
    'SELECT nom FROM Entreprise WHERE id_entreprise = ? LIMIT 1',
    [eid]
  );
  const entrepriseNom = entRows[0]?.nom || 'votre entreprise';

  // Générer le code
  const code = crypto.randomUUID().replace(/-/g, '');

  // Date expiration = +7 jours
  const dateExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const dateExpirationStr = dateExpiration.toISOString().slice(0, 19).replace('T', ' ');

  const invitation = await invitationRepo.create({
    id_entreprise:   eid,
    email,
    role_attribue:   id_role_entreprise,
    code_invitation: code,
    invite_par:      parseInt(session.user.id, 10),
    statut:          'en_attente',
    date_expiration: dateExpirationStr,
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const lien = `${baseUrl}/invitation/${code}`;

  // Nom de l'invitant
  const [invitantRows] = await db.query(
    'SELECT nom, prenom FROM Utilisateur WHERE id_utilisateur = ? LIMIT 1',
    [parseInt(session.user.id, 10)]
  );
  const invitePar = invitantRows.length
    ? `${invitantRows[0].prenom} ${invitantRows[0].nom}`
    : 'Un administrateur';

  // Envoi email (non bloquant)
  sendInvitationEmail(email, entrepriseNom, role.description || role.nom, lien, invitePar).catch(() => {});

  return createdResponse({
    ...invitation,
    lien_invitation: lien,
    role_nom: role.nom,
    entreprise_nom: entrepriseNom,
  });
}

export const GET  = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
