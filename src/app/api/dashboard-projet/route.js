import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
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

  // ── 1. KPIs ──────────────────────────────────────────────────────────────

  const [
    kpiChantiers,
    kpiBudget,
    kpiOuvriers,
    kpiPointages,
    kpiOuvriersAffectes,
    kpiIncidents,
    kpiHSE,
    entrepriseRow,
  ] = await Promise.all([
    // Chantiers stats
    chantierRepo.raw(
      `SELECT
        COUNT(*) AS total,
        SUM(statut = 'en_cours') AS en_cours,
        SUM(statut = 'termine')  AS termines,
        SUM(date_fin_prevue < CURDATE() AND statut NOT IN ('termine','annule')) AS en_retard
       FROM Chantier WHERE id_entreprise = ?`,
      [eid]
    ),
    // Budget
    chantierRepo.raw(
      `SELECT
        COALESCE(SUM(c.budget_prevu), 0) AS budget_prevu,
        COALESCE(SUM(d.total_dep), 0)    AS budget_depense
       FROM Chantier c
       LEFT JOIN (
         SELECT id_chantier, SUM(montant) AS total_dep
         FROM Depense WHERE statut = 'validee'
         GROUP BY id_chantier
       ) d ON c.id_chantier = d.id_chantier
       WHERE c.id_entreprise = ?`,
      [eid]
    ),
    // Ouvriers actifs
    chantierRepo.raw(
      `SELECT COUNT(*) AS total FROM Ouvrier WHERE id_entreprise = ? AND statut = 'actif'`,
      [eid]
    ),
    // Pointages aujourd'hui
    chantierRepo.raw(
      `SELECT COUNT(DISTINCT p.id_ouvrier) AS nb
       FROM Pointage p
       JOIN Chantier c ON p.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND p.date_pointage = CURDATE() AND p.statut = 'present'`,
      [eid]
    ),
    // Ouvriers affectés à des chantiers actifs (pour taux présence)
    chantierRepo.raw(
      `SELECT COUNT(DISTINCT a.id_ouvrier) AS nb
       FROM AffectationChantier a
       JOIN Chantier c ON a.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND c.statut = 'en_cours'
         AND (a.date_fin IS NULL OR a.date_fin >= CURDATE())`,
      [eid]
    ),
    // Incidents ouverts
    chantierRepo.raw(
      `SELECT COUNT(*) AS nb
       FROM IncidentSecurite i
       JOIN Chantier c ON i.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND i.statut != 'clos'`,
      [eid]
    ),
    // Score HSE moyen (mois en cours)
    chantierRepo.raw(
      `SELECT AVG(cl.score) AS score_moyen
       FROM ChecklistSecurite cl
       JOIN Chantier c ON cl.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ?
         AND cl.score IS NOT NULL
         AND MONTH(cl.date_checklist) = MONTH(CURDATE())
         AND YEAR(cl.date_checklist) = YEAR(CURDATE())`,
      [eid]
    ),
    // Nom entreprise
    chantierRepo.raw(
      `SELECT nom FROM Entreprise WHERE id_entreprise = ? LIMIT 1`,
      [eid]
    ),
  ]);

  const kc = kpiChantiers[0] || {};
  const kb = kpiBudget[0]    || {};
  const ko = kpiOuvriers[0]  || {};
  const kp = kpiPointages[0] || {};
  const ka = kpiOuvriersAffectes[0] || {};
  const ki = kpiIncidents[0] || {};
  const kh = kpiHSE[0]       || {};

  const ouvriersAffectes = parseInt(ka.nb, 10) || 0;
  const ouvriersPointes  = parseInt(kp.nb, 10) || 0;
  const tauxPresence     = ouvriersAffectes > 0
    ? Math.round((ouvriersPointes / ouvriersAffectes) * 100)
    : 0;

  const kpis = {
    chantiers_total:         parseInt(kc.total,    10) || 0,
    chantiers_en_cours:      parseInt(kc.en_cours, 10) || 0,
    chantiers_termines:      parseInt(kc.termines, 10) || 0,
    chantiers_en_retard:     parseInt(kc.en_retard,10) || 0,
    budget_total_prevu:      parseFloat(kb.budget_prevu)  || 0,
    budget_total_depense:    parseFloat(kb.budget_depense) || 0,
    ouvriers_actifs:         parseInt(ko.total,   10) || 0,
    ouvriers_pointes_aujourdhui: ouvriersPointes,
    ouvriers_affectes:       ouvriersAffectes,
    taux_presence:           tauxPresence,
    incidents_ouverts:       parseInt(ki.nb, 10) || 0,
    score_hse_moyen:         kh.score_moyen ? parseFloat(parseFloat(kh.score_moyen).toFixed(1)) : null,
  };

  // ── 2. Chantiers enrichis ─────────────────────────────────────────────────

  const chantiers = await chantierRepo.raw(
    `SELECT
      c.id_chantier, c.nom, c.reference, c.statut, c.progression,
      c.budget_prevu, c.date_fin_prevue,
      COALESCE(d.total_depense, 0)   AS total_depense,
      COALESCE(t.nb_taches, 0)       AS nombre_taches,
      COALESCE(t.taches_en_retard, 0) AS taches_en_retard,
      j.dernier_journal_date
     FROM Chantier c
     LEFT JOIN (
       SELECT id_chantier, SUM(montant) AS total_depense
       FROM Depense WHERE statut = 'validee'
       GROUP BY id_chantier
     ) d ON c.id_chantier = d.id_chantier
     LEFT JOIN (
       SELECT id_chantier,
         COUNT(*) AS nb_taches,
         SUM(CASE WHEN date_fin_prevue < CURDATE() AND statut != 'termine' THEN 1 ELSE 0 END) AS taches_en_retard
       FROM Tache
       GROUP BY id_chantier
     ) t ON c.id_chantier = t.id_chantier
     LEFT JOIN (
       SELECT id_chantier, MAX(date_journal) AS dernier_journal_date
       FROM JournalChantier GROUP BY id_chantier
     ) j ON c.id_chantier = j.id_chantier
     WHERE c.id_entreprise = ?
     ORDER BY
       FIELD(c.statut,'en_cours','planifie','en_pause','termine','annule'),
       c.created_at DESC`,
    [eid]
  );

  // ── 3. Alertes ────────────────────────────────────────────────────────────

  const [
    alertesRetard,
    alertesBudget,
    alertesTaches,
    alertesMateriel,
    alertesIncidents,
    alertesDepenses,
    alertesHSE,
  ] = await Promise.all([
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
    // Budgets > 90%
    chantierRepo.raw(
      `SELECT c.id_chantier, c.nom, c.budget_prevu,
         COALESCE(SUM(d.montant),0) AS total_depense,
         ROUND(COALESCE(SUM(d.montant),0) / NULLIF(c.budget_prevu,0) * 100, 1) AS pct
       FROM Chantier c
       LEFT JOIN Depense d ON c.id_chantier = d.id_chantier AND d.statut = 'validee'
       WHERE c.id_entreprise = ? AND c.budget_prevu > 0
         AND c.statut NOT IN ('termine','annule')
       GROUP BY c.id_chantier, c.nom, c.budget_prevu
       HAVING pct >= 90
       ORDER BY pct DESC LIMIT 5`,
      [eid]
    ),
    // Tâches en retard (max 5)
    chantierRepo.raw(
      `SELECT t.id_tache, t.nom AS tache_nom, c.id_chantier, c.nom AS chantier_nom,
         DATEDIFF(CURDATE(), t.date_fin_prevue) AS jours_retard
       FROM Tache t
       JOIN Chantier c ON t.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND t.date_fin_prevue < CURDATE()
         AND t.statut != 'termine'
       ORDER BY jours_retard DESC LIMIT 5`,
      [eid]
    ),
    // Matériel : maintenance due dans 7 jours
    chantierRepo.raw(
      `SELECT id_materiel, nom, date_prochaine_maintenance,
         DATEDIFF(date_prochaine_maintenance, CURDATE()) AS jours_avant
       FROM Materiel
       WHERE id_entreprise = ?
         AND date_prochaine_maintenance IS NOT NULL
         AND date_prochaine_maintenance <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND etat != 'hors_service'
       ORDER BY date_prochaine_maintenance ASC LIMIT 5`,
      [eid]
    ),
    // Incidents non clos
    chantierRepo.raw(
      `SELECT i.id_incident, i.type_incident, i.gravite, i.statut,
         c.id_chantier, c.nom AS chantier_nom,
         DATEDIFF(CURDATE(), i.created_at) AS jours
       FROM IncidentSecurite i
       JOIN Chantier c ON i.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND i.statut != 'clos'
       ORDER BY FIELD(i.gravite,'tres_grave','grave','moyen','benin'),
                i.created_at DESC LIMIT 5`,
      [eid]
    ),
    // Dépenses en attente de validation
    chantierRepo.raw(
      `SELECT COUNT(*) AS nb, COALESCE(SUM(d.montant),0) AS montant_total
       FROM Depense d
       JOIN Chantier c ON d.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND d.statut = 'en_attente'`,
      [eid]
    ),
    // Checklists non conformes (7 derniers jours)
    chantierRepo.raw(
      `SELECT cl.id_checklist, cl.date_checklist, c.id_chantier, c.nom AS chantier_nom
       FROM ChecklistSecurite cl
       JOIN Chantier c ON cl.id_chantier = c.id_chantier
       WHERE c.id_entreprise = ? AND cl.statut = 'non_conforme'
         AND cl.date_checklist >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       ORDER BY cl.date_checklist DESC LIMIT 5`,
      [eid]
    ),
  ]);

  const alertes = [];

  alertesRetard.forEach(r => alertes.push({
    type:    'retard',
    urgence: 'rouge',
    message: `Chantier "${r.nom}" en retard de ${r.jours_retard} jour(s)`,
    lien:    `/chantiers/${r.id_chantier}`,
    id:      `retard-${r.id_chantier}`,
  }));

  alertesBudget.forEach(r => alertes.push({
    type:    'budget',
    urgence: r.pct >= 100 ? 'rouge' : 'orange',
    message: `"${r.nom}" : budget consommé à ${r.pct}%`,
    lien:    `/chantiers/${r.id_chantier}/budget`,
    id:      `budget-${r.id_chantier}`,
  }));

  alertesTaches.forEach(r => alertes.push({
    type:    'tache',
    urgence: 'orange',
    message: `Tâche "${r.tache_nom}" en retard de ${r.jours_retard}j (${r.chantier_nom})`,
    lien:    `/chantiers/${r.id_chantier}/taches`,
    id:      `tache-${r.id_tache}`,
  }));

  alertesMateriel.forEach(r => alertes.push({
    type:    'materiel',
    urgence: r.jours_avant <= 0 ? 'rouge' : 'orange',
    message: `${r.nom} : maintenance ${r.jours_avant <= 0 ? 'due' : `dans ${r.jours_avant} jour(s)`}`,
    lien:    `/materiel`,
    id:      `materiel-${r.id_materiel}`,
  }));

  alertesIncidents.forEach(r => alertes.push({
    type:    'incident',
    urgence: ['tres_grave','grave'].includes(r.gravite) ? 'rouge' : 'orange',
    message: `Incident ${r.type_incident.replace('_',' ')} (${r.gravite.replace('_',' ')}) ouvert — ${r.chantier_nom}`,
    lien:    `/chantiers/${r.id_chantier}/securite`,
    id:      `incident-${r.id_incident}`,
  }));

  const nbDepAttente = parseInt(alertesDepenses[0]?.nb, 10) || 0;
  if (nbDepAttente > 0) {
    alertes.push({
      type:    'depense',
      urgence: 'bleu',
      message: `${nbDepAttente} dépense(s) en attente de validation`,
      lien:    `/chantiers`,
      id:      'depenses-attente',
    });
  }

  alertesHSE.forEach(r => alertes.push({
    type:    'hse',
    urgence: 'orange',
    message: `Checklist non conforme le ${new Date(r.date_checklist).toLocaleDateString('fr-FR')} — ${r.chantier_nom}`,
    lien:    `/chantiers/${r.id_chantier}/securite`,
    id:      `hse-${r.id_checklist}`,
  }));

  // Trier : rouge d'abord
  const ordre = { rouge: 0, orange: 1, bleu: 2 };
  alertes.sort((a, b) => (ordre[a.urgence] ?? 3) - (ordre[b.urgence] ?? 3));

  // ── 4. Activité récente ───────────────────────────────────────────────────

  const activite_recente = await chantierRepo.raw(
    `(SELECT 'journal' AS type, jc.id_chantier, c.nom AS chantier_nom,
        jc.created_at AS date_action,
        CONCAT(u.prenom, ' ', u.nom) AS auteur,
        COALESCE(jc.travaux_realises, jc.resume, 'Journal mis à jour') AS detail
      FROM JournalChantier jc
      JOIN Chantier c ON jc.id_chantier = c.id_chantier
      JOIN Utilisateur u ON jc.redige_par = u.id_utilisateur
      WHERE c.id_entreprise = ?)
    UNION ALL
    (SELECT 'photo' AS type, p.id_chantier, c.nom AS chantier_nom,
        p.created_at AS date_action,
        COALESCE(CONCAT(u.prenom,' ',u.nom), 'Utilisateur') AS auteur,
        COALESCE(p.legende, 'Photo ajoutée') AS detail
      FROM PhotoChantier p
      JOIN Chantier c ON p.id_chantier = c.id_chantier
      LEFT JOIN Utilisateur u ON p.prise_par = u.id_utilisateur
      WHERE c.id_entreprise = ?)
    UNION ALL
    (SELECT 'incident' AS type, i.id_chantier, c.nom AS chantier_nom,
        i.created_at AS date_action,
        CONCAT(u.prenom, ' ', u.nom) AS auteur,
        i.description AS detail
      FROM IncidentSecurite i
      JOIN Chantier c ON i.id_chantier = c.id_chantier
      JOIN Utilisateur u ON i.declare_par = u.id_utilisateur
      WHERE c.id_entreprise = ?)
    ORDER BY date_action DESC
    LIMIT 10`,
    [eid, eid, eid]
  );

  // ── 5. Budget par mois (6 derniers mois) ─────────────────────────────────

  const budget_par_mois = await chantierRepo.raw(
    `SELECT DATE_FORMAT(d.date_depense, '%Y-%m') AS mois,
        DATE_FORMAT(d.date_depense, '%b %Y')  AS mois_label,
        COALESCE(SUM(d.montant), 0)           AS total
     FROM Depense d
     JOIN Chantier c ON d.id_chantier = c.id_chantier
     WHERE c.id_entreprise = ?
       AND d.statut = 'validee'
       AND d.date_depense >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY DATE_FORMAT(d.date_depense, '%Y-%m'), DATE_FORMAT(d.date_depense, '%b %Y')
     ORDER BY mois ASC`,
    [eid]
  );

  return successResponse({
    entreprise_nom: entrepriseRow[0]?.nom || null,
    kpis,
    chantiers,
    alertes,
    activite_recente,
    budget_par_mois,
  });
}

export const GET = apiHandler(handleGET);
