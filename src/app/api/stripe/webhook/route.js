import stripe from '../../../../../lib/stripe.js';
import { connectDB } from '../../../../../lib/database.js';

export async function POST(request) {
  const body = await request.text();
  const sig  = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature invalide:', err.message);
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  const db = await connectDB();

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session     = event.data.object;
        const entrepriseId = parseInt(session.metadata?.entrepriseId, 10);
        const planSlug     = session.metadata?.planSlug;
        const periode      = session.metadata?.periode || 'mensuel';
        const subscriptionId = session.subscription;

        if (!entrepriseId || !planSlug) break;

        // Récupère l'id_plan depuis le slug
        const [planRows] = await db.query(
          `SELECT id_plan FROM Plan WHERE slug = ? LIMIT 1`,
          [planSlug]
        );
        const idPlan = planRows[0]?.id_plan;
        if (!idPlan) break;

        // Récupère la prochaine facture depuis la subscription Stripe
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const prochaineFacture = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10)
          : null;

        await db.query(
          `UPDATE Abonnement
           SET statut = 'actif',
               id_plan = ?,
               stripe_subscription_id = ?,
               periode = ?,
               date_debut = CURDATE(),
               prochaine_facture = ?,
               date_essai_fin = NULL,
               date_fin = NULL
           WHERE id_entreprise = ?`,
          [idPlan, subscriptionId, periode, prochaineFacture, entrepriseId]
        );
        break;
      }

      case 'customer.subscription.updated': {
        const sub          = event.data.object;
        const customerId   = sub.customer;
        const [abRows]     = await db.query(
          `SELECT id_entreprise FROM Abonnement WHERE stripe_customer_id = ? LIMIT 1`,
          [customerId]
        );
        if (!abRows.length) break;
        const entrepriseId = abRows[0].id_entreprise;

        const prochaineFacture = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10)
          : null;
        const statut = sub.status === 'active' ? 'actif'
          : sub.status === 'past_due' ? 'impaye'
          : sub.status === 'canceled' ? 'annule'
          : 'actif';

        await db.query(
          `UPDATE Abonnement SET statut = ?, prochaine_facture = ? WHERE id_entreprise = ?`,
          [statut, prochaineFacture, entrepriseId]
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub        = event.data.object;
        const customerId = sub.customer;
        await db.query(
          `UPDATE Abonnement SET statut = 'annule' WHERE stripe_customer_id = ?`,
          [customerId]
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object;
        const customerId = invoice.customer;
        await db.query(
          `UPDATE Abonnement SET statut = 'impaye' WHERE stripe_customer_id = ?`,
          [customerId]
        );
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Erreur traitement webhook ${event.type}:`, err);
    return Response.json({ error: 'Erreur interne' }, { status: 500 });
  }

  return Response.json({ received: true });
}
