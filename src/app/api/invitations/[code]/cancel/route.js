import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { invitationRepo } from '../../../../../../lib/repositories/invitation.repository.js';
import { successResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError } from '../../../../../../lib/errors/index.js';
import { connectDB } from '../../../../../../lib/database.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function requireAdmin(session, entrepriseId) {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT r.nom FROM Utilisateur u
     INNER JOIN RoleEntreprise r ON u.id_role_entreprise = r.id_role_entreprise
     WHERE u.id_utilisateur = ? AND u.id_entreprise = ?
     LIMIT 1`,
    [parseInt(session.user.id, 10), parseInt(entrepriseId, 10)]
  );
  if (!rows.length || rows[0].nom !== 'admin') {
    throw new AuthorizationError('Accès réservé aux administrateurs');
  }
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  await requireAdmin(session, entrepriseId);

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
