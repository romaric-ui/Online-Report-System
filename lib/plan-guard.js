import { connectDB } from './database.js';
import { PlanLimitError } from './errors/index.js';

export async function getAbonnement(entrepriseId) {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT a.*, p.nom AS plan_nom, p.slug, p.max_utilisateurs, p.max_chantiers,
            p.stockage_go, p.fonctionnalites, p.prix_mensuel, p.prix_annuel
     FROM Abonnement a
     JOIN Plan p ON p.id_plan = a.id_plan
     WHERE a.id_entreprise = ?
     LIMIT 1`,
    [parseInt(entrepriseId, 10)]
  );
  return rows[0] || null;
}

export async function checkPlanLimit(entrepriseId, resource) {
  const db = await connectDB();
  const abonnement = await getAbonnement(entrepriseId);

  if (!abonnement) return null;

  const today = new Date().toISOString().slice(0, 10);

  if (['expire', 'annule', 'impaye'].includes(abonnement.statut)) {
    throw new PlanLimitError('Votre abonnement a expiré. Veuillez renouveler.');
  }

  if (abonnement.statut === 'essai') {
    const essaiFin = abonnement.date_essai_fin?.toISOString?.().slice(0, 10) ?? abonnement.date_essai_fin;
    if (essaiFin && essaiFin < today) {
      await db.query(
        `UPDATE Abonnement SET statut = 'expire' WHERE id_abonnement = ?`,
        [abonnement.id_abonnement]
      );
      throw new PlanLimitError("Votre période d'essai a expiré. Veuillez choisir un plan.");
    }
  }

  const isEssai = abonnement.statut === 'essai';

  if (resource === 'utilisateur') {
    const max = isEssai ? 1 : abonnement.max_utilisateurs;
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM Utilisateur WHERE id_entreprise = ? AND statut != 'bloque'`,
      [parseInt(entrepriseId, 10)]
    );
    const count = parseInt(rows[0]?.total ?? 0, 10);
    if (count >= max) {
      throw new PlanLimitError(
        isEssai
          ? `Limite de ${max} utilisateur pendant l'essai. Activez un plan pour en ajouter davantage.`
          : `Limite de ${max} utilisateur(s) atteinte. Passez au plan supérieur.`
      );
    }
  }

  if (resource === 'chantier') {
    const max = isEssai ? 1 : abonnement.max_chantiers;
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM Chantier WHERE id_entreprise = ? AND statut NOT IN ('termine', 'annule')`,
      [parseInt(entrepriseId, 10)]
    );
    const count = parseInt(rows[0]?.total ?? 0, 10);
    if (count >= max) {
      throw new PlanLimitError(
        isEssai
          ? `Limite de ${max} chantier actif pendant l'essai. Activez un plan pour en créer davantage.`
          : `Limite de ${max} chantier(s) actif(s) atteinte. Passez au plan supérieur.`
      );
    }
  }

  return abonnement;
}

export async function checkFeature(entrepriseId, feature) {
  const abonnement = await getAbonnement(entrepriseId);

  if (!abonnement) return true;

  const today = new Date().toISOString().slice(0, 10);

  if (['expire', 'annule', 'impaye'].includes(abonnement.statut)) {
    throw new PlanLimitError('Votre abonnement a expiré. Veuillez renouveler.');
  }

  if (abonnement.statut === 'essai') {
    const essaiFin = abonnement.date_essai_fin?.toISOString?.().slice(0, 10) ?? abonnement.date_essai_fin;
    if (essaiFin && essaiFin < today) {
      throw new PlanLimitError("Votre période d'essai a expiré. Veuillez choisir un plan.");
    }
  }

  let fonctionnalites = abonnement.fonctionnalites;
  if (typeof fonctionnalites === 'string') {
    try { fonctionnalites = JSON.parse(fonctionnalites); } catch { fonctionnalites = []; }
  }

  if (!Array.isArray(fonctionnalites) || !fonctionnalites.includes(feature)) {
    throw new PlanLimitError(`Cette fonctionnalité nécessite le plan Pro.`);
  }

  return true;
}
