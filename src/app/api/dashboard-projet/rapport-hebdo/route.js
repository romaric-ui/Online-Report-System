import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { chantierRepo } from '../../../../lib/repositories/chantier.repository.js';
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
  const eid = parseInt(entrepriseId, 10);

  // Calcul lundi–dimanche de la semaine en cours
  const now    = new Date();
  const day    = now.getDay(); // 0=dim
  const diffLundi = (day === 0 ? -6 : 1 - day);
  const lundi  = new Date(now);
  lundi.setDate(now.getDate() + diffLundi);
  lundi.setHours(0, 0, 0, 0);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  dimanche.setHours(23, 59, 59, 999);

  const lundiStr    = lundi.toISOString().slice(0, 10);
  const dimancheStr = dimanche.toISOString().slice(0, 10);

  const [
    resumeStats,
    chantiersList,
    alertesRetard,
    alertesBudget,
    alertesIncidents,
    entrepriseInfo,
  ] = await Promise.all([
    // Résumé global semaine
    chantierRepo.raw(
      `SELECT
         SUM(c.statut = 'en_cours')              AS chantiers_actifs,
         AVG(CASE WHEN c.statut = 'en_cours' THEN c.progression END) AS progression_moyenne,
         COALESCE(SUM(c.budget_prevu), 0)         AS budget_total,
         COALESCE(SUM(d.total_dep), 0)            AS depense_totale,
         COALESCE(inc.nb_incidents, 0)            AS incidents_semaine
       FROM Chantier c
       LEFT JOIN (
         SELECT id_chantier, SUM(montant) AS total_dep
         FROM Depense WHERE statut = 'validee'
         GROUP BY id_chantier
       ) d ON c.id_chantier = d.id_chantier
       LEFT JOIN (
         SELECT i.id_chantier, COUNT(*) AS nb_incidents
         FROM IncidentSecurite i
         JOIN Chantier ch ON i.id_chantier = ch.id_chantier
         WHERE ch.id_entreprise = ?
           AND i.created_at >= ? AND i.created_at <= ?
         GROUP BY i.id_chantier
       ) inc ON c.id_chantier = inc.id_chantier
       WHERE c.id_entreprise = ?`,
      [eid, lundiStr, dimancheStr, eid]
    ),

    // Chantiers actifs avec dernière activité
    chantierRepo.raw(
      `SELECT c.id_chantier, c.nom, c.reference, c.statut, c.progression,
         c.date_fin_prevue,
         COALESCE(SUM(d.montant), 0) AS total_depense,
         c.budget_prevu,
         j.derniere_activite
       FROM Chantier c
       LEFT JOIN Depense d ON c.id_chantier = d.id_chantier AND d.statut = 'validee'
       LEFT JOIN (
         SELECT id_chantier, MAX(created_at) AS derniere_activite
         FROM JournalChantier GROUP BY id_chantier
       ) j ON c.id_chantier = j.id_chantier
       WHERE c.id_entreprise = ?
         AND c.statut NOT IN ('annule','termine')
       GROUP BY c.id_chantier, c.nom, c.reference, c.statut, c.progression,
                c.date_fin_prevue, c.budget_prevu, j.derniere_activite
       ORDER BY c.statut = 'en_cours' DESC, c.nom ASC`,
      [eid]
    ),

    // Chantiers en retard
    chantierRepo.raw(
      `SELECT id_chantier, nom, date_fin_prevue,
         DATEDIFF(CURDATE(), date_fin_prevue) AS jours_retard
       FROM Chantier
       WHERE id_entreprise = ? AND date_fin_prevue < CURDATE()
         AND statut NOT IN ('termine','annule')
       ORDER BY jours_retard DESC LIMIT 5`,
      [eid]
    ),

    // Budgets dépassés > 90%
    chantierRepo.raw(
      `SELECT c.id_chantier, c.nom, c.budget_prevu,
         COALESCE(SUM(d.montant), 0) AS total_depense,
         ROUND(COALESCE(SUM(d.montant), 0) / NULLIF(c.budget_prevu, 0) * 100, 1) AS pct
       FROM Chantier c
       LEFT JOIN Depense d ON c.id_chantier = d.id_chantier AND d.statut = 'validee'
       WHERE c.id_entreprise = ? AND c.budget_prevu > 0
         AND c.statut NOT IN ('termine','annule')
       GROUP BY c.id_chantier, c.nom, c.budget_prevu
       HAVING pct >= 90
       ORDER BY pct DESC LIMIT 5`,
      [eid]
    ),

    // Incidents non clos
    chantierRepo.raw(
      `SELECT i.id_incident, i.gravite, i.type_incident,
         c.id_chantier, c.nom AS chantier_nom
       FROM IncidentSecurite i
       JOIN Chantier c ON i.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND i.statut != 'clos'
       ORDER BY FIELD(i.gravite,'tres_grave','grave','moyen','benin') LIMIT 10`,
      [eid]
    ),

    // Nom entreprise
    chantierRepo.raw(
      `SELECT nom FROM Entreprise WHERE id_entreprise = ? LIMIT 1`,
      [eid]
    ),
  ]);

  const r = resumeStats[0] || {};
  const alertes = [];

  alertesRetard.forEach(a => alertes.push({
    type: 'retard', urgence: 'rouge',
    message: `"${a.nom}" en retard de ${a.jours_retard} jour(s)`,
    lien: `/chantiers/${a.id_chantier}`,
  }));

  alertesBudget.forEach(a => alertes.push({
    type: 'budget', urgence: a.pct >= 100 ? 'rouge' : 'orange',
    message: `"${a.nom}" : budget consommé à ${a.pct}%`,
    lien: `/chantiers/${a.id_chantier}/budget`,
  }));

  alertesIncidents.forEach(a => alertes.push({
    type: 'incident', urgence: ['tres_grave','grave'].includes(a.gravite) ? 'rouge' : 'orange',
    message: `Incident ouvert : ${a.type_incident.replace(/_/g,' ')} — ${a.chantier_nom}`,
    lien: `/chantiers/${a.id_chantier}/securite`,
  }));

  return successResponse({
    entreprise_nom: entrepriseInfo[0]?.nom || null,
    periode: { debut: lundiStr, fin: dimancheStr },
    resume: {
      chantiers_actifs:    parseInt(r.chantiers_actifs, 10) || 0,
      progression_moyenne: r.progression_moyenne ? parseFloat(parseFloat(r.progression_moyenne).toFixed(1)) : 0,
      budget_total:        parseFloat(r.budget_total) || 0,
      depense_totale:      parseFloat(r.depense_totale) || 0,
      incidents_semaine:   parseInt(r.incidents_semaine, 10) || 0,
    },
    chantiers: chantiersList,
    alertes,
  });
}

export const GET = apiHandler(handleGET);
