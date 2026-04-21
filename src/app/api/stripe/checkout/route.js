import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import stripe from '../../../../../lib/stripe.js';
import { getAbonnement } from '../../../../../lib/plan-guard.js';
import { connectDB } from '../../../../../lib/database.js';
import { requireTenant } from '../../../../../lib/tenant.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, ValidationError } from '../../../../../lib/errors/index.js';

const PRICE_MAP = {
  essentiel_mensuel: () => process.env.STRIPE_PRICE_ESSENTIEL_MENSUEL,
  essentiel_annuel:  () => process.env.STRIPE_PRICE_ESSENTIEL_ANNUEL,
  pro_mensuel:       () => process.env.STRIPE_PRICE_PRO_MENSUEL,
  pro_annuel:        () => process.env.STRIPE_PRICE_PRO_ANNUEL,
};

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
  const body = await request.json();
  const { planSlug, periode } = body;

  if (!planSlug || !['essentiel', 'pro'].includes(planSlug)) {
    throw new ValidationError('planSlug invalide (essentiel ou pro)');
  }
  if (!periode || !['mensuel', 'annuel'].includes(periode)) {
    throw new ValidationError('periode invalide (mensuel ou annuel)');
  }

  const priceId = PRICE_MAP[`${planSlug}_${periode}`]?.();
  if (!priceId) {
    throw new ValidationError(`Prix Stripe non configuré pour ${planSlug}/${periode}`);
  }

  const abonnement = await getAbonnement(entrepriseId);
  const db = await connectDB();

  // Récupère ou crée le customer Stripe
  let customerId = abonnement?.stripe_customer_id || null;
  if (!customerId) {
    const [userRows] = await db.query(
      `SELECT u.email, e.nom AS entreprise_nom
       FROM Utilisateur u
       JOIN Entreprise e ON e.id_entreprise = u.id_entreprise
       WHERE u.id_utilisateur = ?`,
      [parseInt(session.user.id, 10)]
    );
    const userInfo = userRows[0];
    const customer = await stripe.customers.create({
      email: userInfo?.email || session.user.email,
      name:  userInfo?.entreprise_nom || undefined,
      metadata: { entrepriseId: String(entrepriseId) },
    });
    customerId = customer.id;

    // Sauvegarde le customer_id
    if (abonnement) {
      await db.query(
        `UPDATE Abonnement SET stripe_customer_id = ? WHERE id_entreprise = ?`,
        [customerId, parseInt(entrepriseId, 10)]
      );
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:             customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode:                 'subscription',
    subscription_data:    { trial_period_days: 7 },
    success_url: `${process.env.NEXTAUTH_URL}/abonnement?success=true`,
    cancel_url:  `${process.env.NEXTAUTH_URL}/abonnement?canceled=true`,
    metadata: {
      entrepriseId: String(entrepriseId),
      planSlug,
      periode,
    },
  });

  return successResponse({ url: checkoutSession.url });
}

export const POST = apiHandler(handlePOST);
