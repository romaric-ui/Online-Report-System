import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function parseChantierId(params) {
  const resolved = await params;
  const id = parseInt(resolved.id, 10);
  if (!id || Number.isNaN(id) || id <= 0) throw new ValidationError('ID chantier invalide');
  return id;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId   = await parseChantierId(params);

  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }

  const [
    journalSemaine,
    tachesStats,
    tachesListe,
    equipe,
    heuresEquipe,
    budgetInfo,
    depensesRecentes,
    hseScore,
    incidentsOuverts,
    derniereChecklist,
    photosRecentes,
    entrepriseInfo,
  ] = await Promise.all([
    // Journal des 7 derniers jours
    chantierRepo.raw(
      `SELECT date_journal, meteo, resume, travaux_realises, problemes, decisions, observations
       FROM JournalChantier
       WHERE id_chantier = ? AND date_journal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       ORDER BY date_journal DESC`,
      [chantierId]
    ),

    // Stats tâches
    chantierRepo.raw(
      `SELECT
         COUNT(*) AS total,
         SUM(statut = 'a_faire')  AS a_faire,
         SUM(statut = 'en_cours') AS en_cours,
         SUM(statut = 'termine')  AS terminees,
         SUM(date_fin_prevue < CURDATE() AND statut != 'termine') AS en_retard
       FROM Tache WHERE id_chantier = ?`,
      [chantierId]
    ),

    // Tâches en cours + en retard
    chantierRepo.raw(
      `SELECT nom, statut, pourcentage, date_fin_prevue, priorite
       FROM Tache
       WHERE id_chantier = ?
         AND (statut = 'en_cours' OR (date_fin_prevue < CURDATE() AND statut != 'termine'))
       ORDER BY FIELD(statut,'en_cours','a_faire','en_attente'), date_fin_prevue ASC
       LIMIT 20`,
      [chantierId]
    ),

    // Équipe affectée
    chantierRepo.raw(
      `SELECT o.nom, o.prenom, o.poste, o.specialite
       FROM Ouvrier o
       INNER JOIN AffectationChantier a ON o.id_ouvrier = a.id_ouvrier
       WHERE a.id_chantier = ?
         AND (a.date_fin IS NULL OR a.date_fin >= CURDATE())
       ORDER BY o.nom ASC`,
      [chantierId]
    ),

    // Heures pointées cette semaine par ouvrier
    chantierRepo.raw(
      `SELECT o.nom, o.prenom,
         COALESCE(SUM(p.heures_travaillees), 0) AS heures_semaine
       FROM Ouvrier o
       INNER JOIN AffectationChantier a ON o.id_ouvrier = a.id_ouvrier
       LEFT JOIN Pointage p ON p.id_ouvrier = o.id_ouvrier
         AND p.id_chantier = ?
         AND p.date_pointage >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         AND p.statut = 'present'
       WHERE a.id_chantier = ?
         AND (a.date_fin IS NULL OR a.date_fin >= CURDATE())
       GROUP BY o.id_ouvrier, o.nom, o.prenom
       ORDER BY o.nom ASC`,
      [chantierId, chantierId]
    ),

    // Budget
    chantierRepo.raw(
      `SELECT c.budget_prevu,
         COALESCE(SUM(d.montant), 0) AS total_depense
       FROM Chantier c
       LEFT JOIN Depense d ON c.id_chantier = d.id_chantier AND d.statut = 'validee'
       WHERE c.id_chantier = ?
       GROUP BY c.id_chantier, c.budget_prevu`,
      [chantierId]
    ),

    // 5 dernières dépenses validées
    chantierRepo.raw(
      `SELECT description, montant, categorie, date_depense
       FROM Depense
       WHERE id_chantier = ? AND statut = 'validee'
       ORDER BY date_depense DESC LIMIT 5`,
      [chantierId]
    ),

    // Score HSE moyen du mois
    chantierRepo.raw(
      `SELECT AVG(score) AS score_moyen
       FROM ChecklistSecurite
       WHERE id_chantier = ? AND score IS NOT NULL
         AND MONTH(date_checklist) = MONTH(CURDATE())
         AND YEAR(date_checklist)  = YEAR(CURDATE())`,
      [chantierId]
    ),

    // Incidents ouverts
    chantierRepo.raw(
      `SELECT COUNT(*) AS nb FROM IncidentSecurite
       WHERE id_chantier = ? AND statut != 'clos'`,
      [chantierId]
    ),

    // Dernière checklist
    chantierRepo.raw(
      `SELECT date_checklist, type_checklist, statut, score
       FROM ChecklistSecurite
       WHERE id_chantier = ?
       ORDER BY date_checklist DESC LIMIT 1`,
      [chantierId]
    ),

    // 10 dernières photos
    chantierRepo.raw(
      `SELECT url, legende, type_photo, created_at
       FROM PhotoChantier
       WHERE id_chantier = ?
       ORDER BY created_at DESC LIMIT 10`,
      [chantierId]
    ),

    // Nom entreprise
    chantierRepo.raw(
      `SELECT nom FROM Entreprise WHERE id_entreprise = ? LIMIT 1`,
      [entrepriseId]
    ),
  ]);

  const budgetRow    = budgetInfo[0] || {};
  const budgetPrevu  = parseFloat(budgetRow.budget_prevu) || 0;
  const totalDepense = parseFloat(budgetRow.total_depense) || 0;
  const tStats       = tachesStats[0] || {};

  return successResponse({
    chantier: {
      ...chantier,
      entreprise_nom: entrepriseInfo[0]?.nom || null,
    },
    journal_semaine: journalSemaine,
    taches: {
      stats: {
        total:     parseInt(tStats.total,     10) || 0,
        a_faire:   parseInt(tStats.a_faire,   10) || 0,
        en_cours:  parseInt(tStats.en_cours,  10) || 0,
        terminees: parseInt(tStats.terminees, 10) || 0,
        en_retard: parseInt(tStats.en_retard, 10) || 0,
      },
      liste: tachesListe,
    },
    equipe: heuresEquipe.map(h => ({
      nom:            h.nom,
      prenom:         h.prenom,
      heures_semaine: parseFloat(h.heures_semaine) || 0,
    })),
    budget: {
      budget_prevu:  budgetPrevu,
      total_depense: totalDepense,
      reste:         budgetPrevu - totalDepense,
      pourcentage:   budgetPrevu > 0 ? parseFloat(((totalDepense / budgetPrevu) * 100).toFixed(1)) : 0,
      depenses_recentes: depensesRecentes,
    },
    securite: {
      score_hse_moyen:    hseScore[0]?.score_moyen ? parseFloat(parseFloat(hseScore[0].score_moyen).toFixed(1)) : null,
      incidents_ouverts:  parseInt(incidentsOuverts[0]?.nb, 10) || 0,
      derniere_checklist: derniereChecklist[0] || null,
    },
    photos_recentes: photosRecentes,
  });
}

export const GET = apiHandler(handleGET);
