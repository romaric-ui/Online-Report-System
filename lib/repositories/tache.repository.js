import { BaseRepository } from './base.repository.js';
import { chantierRepo } from './chantier.repository.js';

/**
 * Invariants automatiques appliqués selon le statut.
 * Centralise les règles métier "quand X, alors Y" sur les tâches.
 * Extensible : ajouter d'autres statuts ici sans toucher au code des mutations.
 */
const STATUT_INVARIANTS = {
  termine: { pourcentage: 100 },
};

/**
 * Champs dont la mutation impacte la progression du chantier.
 * Si un de ces champs change, on recalcule la progression dans la même transaction.
 */
const CHAMPS_IMPACTANT_PROGRESSION = [
  'pourcentage',
  'duree_jours',
  'parent_id',
  'statut',
  'id_chantier', // changement de chantier = recalcul des deux
];

function applyStatutInvariants(data) {
  if (!data?.statut || !STATUT_INVARIANTS[data.statut]) {
    return data;
  }
  return { ...data, ...STATUT_INVARIANTS[data.statut] };
}

export class TacheRepository extends BaseRepository {
  constructor() {
    super('Tache', 'id_tache');
  }

  async findByChantier(chantierId, { statut, lotId } = {}, conn = null) {
    const whereClauses = ['id_chantier = ?'];
    const params = [chantierId];

    if (statut) {
      whereClauses.push('statut = ?');
      params.push(statut);
    }
    if (lotId !== undefined && lotId !== null) {
      whereClauses.push('id_lot = ?');
      params.push(lotId);
    }

    return this.raw(
      `SELECT * FROM Tache WHERE ${whereClauses.join(' AND ')}`,
      params,
      conn
    );
  }

  async countByStatut(chantierId, conn = null) {
    const rows = await this.raw(
      'SELECT statut, COUNT(*) AS count FROM Tache WHERE id_chantier = ? GROUP BY statut',
      [chantierId],
      conn
    );

    return rows.reduce((acc, row) => {
      acc[row.statut] = row.count;
      return acc;
    }, {});
  }

  /**
   * Crée une tâche et recalcule la progression du chantier dans la même transaction.
   * Applique les invariants de statut (ex: termine → pourcentage=100).
   */
  async create(rawData) {
    const data = applyStatutInvariants(rawData);

    return this.transaction(async (conn) => {
      const tache = await super.create(data, conn);
      await chantierRepo.updateProgression(tache.id_chantier, conn);
      return tache;
    });
  }

  /**
   * Met à jour une tâche et recalcule la progression si nécessaire.
   * Gère le cas du changement de chantier (recalcul ancien + nouveau).
   * Applique les invariants de statut.
   */
  async update(id, rawData) {
    const data = applyStatutInvariants(rawData);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return this.transaction(async (conn) => {
      const existing = await super.findById(id, conn);
      await super.update(id, data, conn);
      const fresh = await super.findById(id, conn);

      const impacteProgression = CHAMPS_IMPACTANT_PROGRESSION.some(c => c in data);

      if (impacteProgression) {
        await chantierRepo.updateProgression(fresh.id_chantier, conn);

        // Si la tâche a changé de chantier, recalculer aussi l'ancien
        if (existing.id_chantier !== fresh.id_chantier) {
          await chantierRepo.updateProgression(existing.id_chantier, conn);
        }
      }

      return fresh;
    });
  }

  /**
   * Supprime une tâche et recalcule la progression du chantier dans la même transaction.
   * Note : les sous-tâches (FK parent_id ON DELETE SET NULL) deviennent orphelines
   * et sont automatiquement comptées comme feuilles dans le prochain calcul.
   */
  async delete(id) {
    return this.transaction(async (conn) => {
      const tache = await super.findById(id, conn);
      await super.delete(id, conn);
      await chantierRepo.updateProgression(tache.id_chantier, conn);
      return tache;
    });
  }
}

export const tacheRepo = new TacheRepository();