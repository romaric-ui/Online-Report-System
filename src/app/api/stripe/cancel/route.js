import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import stripe from '../../../../../lib/stripe.js';
import { getAbonnement } from '../../../../../lib/plan-guard.js';
import { connectDB } from '../../../../../lib/database.js';
import { requireTenant } from '../../../../../lib/tenant.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, ValidationError } from '../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const abonnement   = await getAbonnement(entrepriseId);

  if (!abonnement?.stripe_subscription_id) {
    throw new ValidationError('Aucun abonnement Stripe actif à annuler');
  }

  await stripe.subscriptions.cancel(abonnement.stripe_subscription_id);

  const db = await connectDB();
  await db.query(
    `UPDATE Abonnement SET statut = 'annule' WHERE id_entreprise = ?`,
    [parseInt(entrepriseId, 10)]
  );

  return successResponse({ message: 'Abonnement annulé avec succès' });
}

export const POST = apiHandler(handlePOST);
