import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { tacheRepo } from '../../../../../../lib/repositories/tache.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { calculateCPM } from '../../../../../../lib/algorithms/cpm.js';
import { apiHandler, successResponse, createdResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

async function parseChantierId(params) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (!id || Number.isNaN(id) || id <= 0) throw new ValidationError('ID chantier invalide');
  return id;
}

async function verifyChantierEntreprise(chantierId, entrepriseId) {
  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }
  return chantier;
}

async function fetchDependances(chantierId) {
  return tacheRepo.raw(
    `SELECT dt.* FROM DependanceTache dt
     WHERE dt.id_predecesseur IN (SELECT id_tache FROM Tache WHERE id_chantier = ?)`,
    [chantierId]
  );
}

async function recalcAndSaveCPM(chantierId) {
  const taches = await tacheRepo.findByChantier(chantierId);
  const dependances = await fetchDependances(chantierId);
  const enriched = calculateCPM(taches, dependances);

  await Promise.all(
    enriched.map(t =>
      tacheRepo.update(t.id_tache, {
        est_critique: t.est_critique ? 1 : 0,
        marge_jours: t.marge_jours,
      })
    )
  );

  return enriched;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const taches = await tacheRepo.findByChantier(chantierId);
  const dependances = await fetchDependances(chantierId);
  const jalons = await tacheRepo.raw(
    'SELECT * FROM Jalon WHERE id_chantier = ? ORDER BY date_prevue',
    [chantierId]
  );

  const tachesAvecCPM = calculateCPM(taches, dependances);

  const dureeTotale = tachesAvecCPM.length
    ? Math.max(...tachesAvecCPM.map(t => t.EF || 0))
    : 0;

  const nbCritiques = tachesAvecCPM.filter(t => t.est_critique).length;

  const dateDebutProjet = taches
    .filter(t => t.date_debut)
    .map(t => (typeof t.date_debut === 'string' ? t.date_debut : t.date_debut.toISOString().slice(0, 10)))
    .sort()[0] || null;

  let dateFinEstimee = null;
  if (dateDebutProjet && dureeTotale > 0) {
    const d = new Date(dateDebutProjet);
    d.setDate(d.getDate() + dureeTotale);
    dateFinEstimee = d.toISOString().slice(0, 10);
  }

  return successResponse({
    taches: tachesAvecCPM,
    dependances,
    jalons,
    resume: {
      duree_totale: dureeTotale,
      nb_taches_critiques: nbCritiques,
      date_debut_projet: dateDebutProjet,
      date_fin_estimee: dateFinEstimee,
    },
  });
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_predecesseur, id_successeur, type_lien = 'FS', delai_jours = 0 } = body;

  if (!id_predecesseur || !id_successeur) {
    throw new ValidationError('id_predecesseur et id_successeur sont requis');
  }
  if (parseInt(id_predecesseur, 10) === parseInt(id_successeur, 10)) {
    throw new ValidationError("Une tâche ne peut pas dépendre d'elle-même");
  }
  if (!['FS', 'FF', 'SS', 'SF'].includes(type_lien)) {
    throw new ValidationError('type_lien doit être FS, FF, SS ou SF');
  }

  await tacheRepo.raw(
    'INSERT INTO DependanceTache (id_predecesseur, id_successeur, type_lien, delai_jours) VALUES (?, ?, ?, ?)',
    [parseInt(id_predecesseur, 10), parseInt(id_successeur, 10), type_lien, parseInt(delai_jours, 10) || 0]
  );

  await recalcAndSaveCPM(chantierId);

  return createdResponse({ message: 'Dépendance ajoutée et CPM recalculé' });
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_tache, ...updates } = body;

  if (!id_tache) throw new ValidationError('id_tache est requis');

  const allowed = ['duree_jours', 'date_debut', 'date_fin_prevue', 'nom', 'couleur', 'parent_id'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(filtered).length > 0) {
    await tacheRepo.update(parseInt(id_tache, 10), filtered);
  }

  await recalcAndSaveCPM(chantierId);

  return successResponse({ message: 'Tâche mise à jour et CPM recalculé' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
