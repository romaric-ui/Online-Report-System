import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { notifRepo } from '../../../../../lib/repositories/notification.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthorizationError } from '../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function handleGET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    throw new AuthorizationError('Non autorisé');
  }

  const [newUsers] = await notifRepo.raw(
    `SELECT COUNT(*) as count FROM utilisateur WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    []
  );

  const [newReports] = await notifRepo.raw(
    `SELECT COUNT(*) as count FROM rapport WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    []
  );

  const [recentLogins] = await notifRepo.raw(
    `SELECT COUNT(*) as count FROM utilisateur WHERE derniere_connexion >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    []
  );

  const notifications = [];
  if (newUsers[0]?.count > 0) {
    notifications.push({
      type: 'user',
      title: 'Nouveaux utilisateurs',
      message: `${newUsers[0].count} nouveau(x) utilisateur(s) inscrit(s) aujourd'hui`,
      time: 'Aujourd\'hui'
    });
  }

  if (newReports[0]?.count > 0) {
    notifications.push({
      type: 'report',
      title: 'Nouveaux rapports',
      message: `${newReports[0].count} nouveau(x) rapport(s) créé(s) aujourd'hui`,
      time: 'Aujourd\'hui'
    });
  }

  if (recentLogins[0]?.count > 0) {
    notifications.push({
      type: 'user',
      title: 'Activité récente',
      message: `${recentLogins[0].count} utilisateur(s) connecté(s) récemment`,
      time: 'Il y a 1h'
    });
  }

  return successResponse(notifications);
}

export const GET = apiHandler(handleGET);
