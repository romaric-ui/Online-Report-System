import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { reportRepo } from '../../../../../lib/repositories/report.repository.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError } from '../../../../../lib/errors/index.js';
import { connectDB } from '../../../../../lib/database.js';

const apiHandler = (handler) => async (request, context) => {
  try { return await handler(request, context); }
  catch (error) { return errorResponse(error, request); }
};

async function handleGET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  if (session.user.entrepriseId) {
    return successResponse({ limite: false, paywall: false });
  }

  // Infos abonnement (sans le compteur stocké)
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT abonnement_particulier, abonnement_particulier_expire_at
     FROM Utilisateur WHERE id_utilisateur = ? LIMIT 1`,
    [session.user.id]
  );

  const userInfo = rows[0];

  // COUNT(*) live — toujours synchronisé, même après suppression
  const nbRapports = await reportRepo.countByUser(session.user.id);

  const isAbonne = userInfo?.abonnement_particulier === 'pro'
    && userInfo?.abonnement_particulier_expire_at
    && new Date(userInfo.abonnement_particulier_expire_at) > new Date();

  return successResponse({
    nb_rapports: nbRapports,
    abonnement: userInfo?.abonnement_particulier || 'gratuit',
    is_abonne: isAbonne,
    limite_atteinte: !isAbonne && nbRapports >= 1,
    paywall: !isAbonne && nbRapports >= 1,
  });
}

export const GET = apiHandler(handleGET);