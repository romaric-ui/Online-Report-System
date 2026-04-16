import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { successResponse, errorResponse } from '../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../lib/tenant.js';
import { AuthenticationError, ValidationError } from '../../../../lib/errors/index.js';
import { connectDB } from '../../../../lib/database.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    console.error('[equipe-projet]', error?.code, error?.message, error?.sqlMessage);
    return errorResponse(error, request);
  }
};

// GET — liste des membres de l'entreprise
async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // admin entreprise uniquement

  const db  = await connectDB();
  const eid = parseInt(entrepriseId, 10);

  const [members] = await db.query(
    `SELECT
       u.id_utilisateur,
       u.nom, u.prenom, u.email,
       u.id_role_entreprise,
       r.nom        AS role_nom,
       r.description AS role_description,
       u.date_creation
     FROM Utilisateur u
     LEFT JOIN RoleEntreprise r ON u.id_role_entreprise = r.id_role_entreprise
     WHERE u.id_entreprise = ?
     ORDER BY r.id_role_entreprise ASC, u.nom ASC`,
    [eid]
  );

  // Liste des rôles disponibles
  const [roles] = await db.query('SELECT * FROM RoleEntreprise ORDER BY id_role_entreprise ASC');

  return successResponse({ members, roles });
}

// PUT — changer le rôle d'un membre
async function handlePUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // admin entreprise uniquement

  const body = await request.json();
  const targetUserId     = parseInt(body.id_utilisateur, 10);
  const newRoleId        = parseInt(body.id_role_entreprise, 10);
  const currentUserId    = parseInt(session.user.id, 10);

  if (!targetUserId || !newRoleId) throw new ValidationError('id_utilisateur et id_role_entreprise requis');

  const db  = await connectDB();
  const eid = parseInt(entrepriseId, 10);

  // Vérifier que la cible est bien dans l'entreprise
  const [targetRows] = await db.query(
    'SELECT id_utilisateur FROM Utilisateur WHERE id_utilisateur = ? AND id_entreprise = ? LIMIT 1',
    [targetUserId, eid]
  );
  if (!targetRows.length) throw new ValidationError('Membre introuvable dans cette entreprise');

  // Vérifier le nouveau rôle
  const [roleRows] = await db.query(
    'SELECT * FROM RoleEntreprise WHERE id_role_entreprise = ? LIMIT 1',
    [newRoleId]
  );
  if (!roleRows.length) throw new ValidationError('Rôle invalide');

  // Impossible de se retirer soi-même le rôle admin
  if (targetUserId === currentUserId && roleRows[0].nom !== 'admin') {
    throw new ValidationError('Vous ne pouvez pas vous retirer le rôle administrateur');
  }

  await db.query(
    'UPDATE Utilisateur SET id_role_entreprise = ? WHERE id_utilisateur = ? AND id_entreprise = ?',
    [newRoleId, targetUserId, eid]
  );

  return successResponse({ message: 'Rôle mis à jour' });
}

// DELETE — retirer un membre
async function handleDELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1]); // admin entreprise uniquement

  const { searchParams } = new URL(request.url);
  const targetUserId  = parseInt(searchParams.get('id_utilisateur'), 10);
  const currentUserId = parseInt(session.user.id, 10);

  if (!targetUserId) throw new ValidationError('id_utilisateur requis');
  if (targetUserId === currentUserId) {
    throw new ValidationError('Vous ne pouvez pas vous retirer vous-même de l\'entreprise');
  }

  const db  = await connectDB();
  const eid = parseInt(entrepriseId, 10);

  const [targetRows] = await db.query(
    'SELECT id_utilisateur FROM Utilisateur WHERE id_utilisateur = ? AND id_entreprise = ? LIMIT 1',
    [targetUserId, eid]
  );
  if (!targetRows.length) throw new ValidationError('Membre introuvable dans cette entreprise');

  await db.query(
    'UPDATE Utilisateur SET id_entreprise = NULL, id_role_entreprise = NULL WHERE id_utilisateur = ?',
    [targetUserId]
  );

  return successResponse({ message: 'Membre retiré de l\'entreprise' });
}

export const GET    = apiHandler(handleGET);
export const PUT    = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
