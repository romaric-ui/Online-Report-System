/**
 * Algorithme du Chemin Critique (CPM)
 *
 * Entrée :
 *   taches[]      — { id_tache, nom, duree_jours, date_debut, date_fin_prevue, ... }
 *   dependances[] — { id_predecesseur, id_successeur, type_lien, delai_jours }
 *
 * Sortie : taches enrichies avec ES, EF, LS, LF, marge_jours, est_critique
 *
 * Seul le type FS (Finish-to-Start) est implémenté.
 */
export function calculateCPM(taches, dependances) {
  if (!taches || taches.length === 0) return [];

  const deps = dependances || [];

  // Build adjacency lists keyed by id_tache
  const successors = new Map();   // id → [{ id, delai }]
  const predecessors = new Map(); // id → [{ id, delai }]

  taches.forEach(t => {
    successors.set(t.id_tache, []);
    predecessors.set(t.id_tache, []);
  });

  deps.forEach(dep => {
    const pred = dep.id_predecesseur;
    const succ = dep.id_successeur;
    const delai = dep.delai_jours || 0;
    if (successors.has(pred)) successors.get(pred).push({ id: succ, delai });
    if (predecessors.has(succ)) predecessors.get(succ).push({ id: pred, delai });
  });

  // Kahn's topological sort
  const inDegree = new Map();
  taches.forEach(t => inDegree.set(t.id_tache, (predecessors.get(t.id_tache) || []).length));

  const queue = [];
  inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });

  const topoOrder = [];
  const visited = new Set();

  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    topoOrder.push(id);
    (successors.get(id) || []).forEach(({ id: succId }) => {
      const newDeg = (inDegree.get(succId) || 0) - 1;
      inDegree.set(succId, newDeg);
      if (newDeg <= 0) queue.push(succId);
    });
  }

  // Include any tasks not reached (cycles / disconnected)
  taches.forEach(t => {
    if (!visited.has(t.id_tache)) topoOrder.push(t.id_tache);
  });

  // Forward pass : ES(i) = max(EF(prédécesseurs) + délai), EF(i) = ES(i) + durée
  const ES = new Map();
  const EF = new Map();

  topoOrder.forEach(id => {
    const duree = taches.find(t => t.id_tache === id)?.duree_jours || 0;
    const preds = predecessors.get(id) || [];
    const es = preds.length
      ? Math.max(...preds.map(p => (EF.get(p.id) || 0) + p.delai))
      : 0;
    ES.set(id, es);
    EF.set(id, es + duree);
  });

  // Durée totale du projet
  const projectDuration = EF.size ? Math.max(...Array.from(EF.values())) : 0;

  // Backward pass : LF(i) = min(LS(successeurs) - délai), LS(i) = LF(i) - durée
  const LS = new Map();
  const LF = new Map();

  [...topoOrder].reverse().forEach(id => {
    const duree = taches.find(t => t.id_tache === id)?.duree_jours || 0;
    const succs = successors.get(id) || [];
    const lf = succs.length
      ? Math.min(...succs.map(s => {
          const lsSucc = LS.has(s.id) ? LS.get(s.id) : projectDuration;
          return lsSucc - s.delai;
        }))
      : projectDuration;
    LF.set(id, lf);
    LS.set(id, lf - duree);
  });

  // Enrichir chaque tâche
  return taches.map(t => {
    const id = t.id_tache;
    const es = ES.get(id) ?? 0;
    const ef = EF.get(id) ?? es + (t.duree_jours || 0);
    const ls = LS.get(id) ?? es;
    const lf = LF.get(id) ?? ef;
    const marge = Math.max(0, Math.round(ls - es));
    return {
      ...t,
      ES: es,
      EF: ef,
      LS: ls,
      LF: lf,
      marge_jours: marge,
      est_critique: marge === 0 && (t.duree_jours || 0) > 0,
    };
  });
}
