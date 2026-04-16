import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { reportRepo } from '../../../../../lib/repositories/report.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError } from '../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    console.error('API admin/dashboard error:', error);
    return errorResponse(error, request);
  }
};

async function handleGET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Non authentifié');
  }
  if (session.user.role !== 'admin') {
    throw new AuthorizationError('Accès non autorisé');
  }

  const usersCount = await userRepo.count();
  const newUsersCountRows = await userRepo.raw(
    'SELECT COUNT(*) as newCount FROM Utilisateur WHERE DATE(date_creation) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)',
    []
  );
  const previousMonthUsersRows = await userRepo.raw(
    'SELECT COUNT(*) as prevCount FROM Utilisateur WHERE DATE(date_creation) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE(date_creation) < DATE_SUB(CURDATE(), INTERVAL 30 DAY)',
    []
  );

  const previousCount = previousMonthUsersRows[0]?.prevCount || 0;
  const newCount = newUsersCountRows[0]?.newCount || 0;
  const growth = previousCount > 0
    ? Math.round(((newCount - previousCount) / previousCount) * 100)
    : newCount > 0 ? 100 : 0;

  const reportsTotal = await reportRepo.count();
  const reportsPending = await reportRepo.count('(statut = ? OR statut IS NULL)', ['en_attente']);
  const reportsValidated = await reportRepo.count('statut = ?', ['valide']);
  const reportsRejected = await reportRepo.count('statut = ?', ['rejete']);

  const recentActivity = await reportRepo.raw(`
    SELECT 
      r.id_rapport,
      r.nom_chantier,
      r.statut,
      r.date_creation,
      u.nom,
      u.prenom
    FROM Rapport r
    JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
    ORDER BY r.date_creation DESC
    LIMIT 10
  `, []);

  const stats = {
    users: {
      total: usersCount || 0,
      new: newCount,
      growth
    },
    reports: {
      total: reportsTotal || 0,
      pending: reportsPending || 0,
      validated: reportsValidated || 0,
      rejected: reportsRejected || 0
    },
    activity: recentActivity || []
  };

  return successResponse(stats);
}

export const GET = apiHandler(handleGET);
