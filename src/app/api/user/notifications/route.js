import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { notifRepo } from '../../../../../lib/repositories/notification.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, ValidationError } from '../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const { searchParams } = new URL(request.url);
  const nonLues = searchParams.get('nonLues') === 'true';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);
  const userId = parseInt(session.user.id, 10);

  let query = `
    SELECT
      id_notification,
      type_notification,
      titre,
      contenu,
      lien,
      lu,
      date_creation,
      date_lecture
    FROM Notification
    WHERE id_utilisateur = ?
  `;

  if (nonLues) {
    query += ' AND lu = FALSE';
  }
  query += ' ORDER BY date_creation DESC LIMIT ?';
  const notifications = await notifRepo.raw(query, [userId, parseInt(limit, 10)]);
  const nonLuesCount = await notifRepo.count('id_utilisateur = ? AND lu = FALSE', [userId]);

  return successResponse({ notifications, nonLuesCount });
}

async function handlePUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const { id_notification, marquerToutesLues } = await request.json();
  const userId = parseInt(session.user.id, 10);

  if (marquerToutesLues) {
    await notifRepo.markAllAsRead(userId);
    return successResponse({ message: 'Toutes les notifications marquées comme lues' });
  }

  if (!id_notification) {
    throw new ValidationError('ID de notification requis');
  }

  await notifRepo.markAsRead(parseInt(id_notification, 10), userId);
  return successResponse({ message: 'Notification marquée comme lue' });
}

async function handleDELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const toutesLues = searchParams.get('toutesLues') === 'true';

  const userId = parseInt(session.user.id, 10);

  if (toutesLues) {
    await notifRepo.raw('DELETE FROM Notification WHERE id_utilisateur = ? AND lu = TRUE', [userId]);
    return successResponse({ message: 'Notifications lues supprimées' });
  }

  if (!id) {
    throw new ValidationError('ID requis');
  }

  const result = await notifRepo.raw(
    'DELETE FROM Notification WHERE id_notification = ? AND id_utilisateur = ?',
    [parseInt(id, 10), userId]
  );

  if (result.affectedRows === 0) {
    throw new ValidationError('Notification non trouvée');
  }

  return successResponse({ message: 'Notification supprimée' });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
