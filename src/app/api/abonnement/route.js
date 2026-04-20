import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { getAbonnement } from '../../../../lib/plan-guard.js';
import { successResponse, errorResponse } from '../../../../lib/api-response.js';
import { requireTenant } from '../../../../lib/tenant.js';
import { AuthenticationError } from '../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const abonnement = await getAbonnement(entrepriseId);
  return successResponse(abonnement);
}

export const GET = apiHandler(handleGET);
