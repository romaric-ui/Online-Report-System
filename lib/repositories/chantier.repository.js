import { BaseRepository } from './base.repository.js';
import { NotFoundError } from '../errors/index.js';

const SORT_REGEX = /^[a-zA-Z0-9_]+\s+(ASC|DESC)$/i;

export class ChantierRepository extends BaseRepository {
  constructor() {
    super('Chantier', 'id_chantier');
  }

  async findByEntreprise(entrepriseId, { page = 1, limit = 20, search, statut, sort = 'created_at DESC' } = {}) {
    const whereClauses = ['id_entreprise = ?'];
    const params = [entrepriseId];

    if (statut) {
      whereClauses.push('statut = ?');
      params.push(statut);
    }

    if (search) {
      whereClauses.push('(nom LIKE ? OR reference LIKE ? OR client_nom LIKE ?)');
      const likeQuery = `%${search}%`;
      params.push(likeQuery, likeQuery, likeQuery);
    }

    const orderBy = SORT_REGEX.test(sort) ? sort : 'created_at DESC';
    const offset = (page - 1) * limit;

    return this.raw(
      `SELECT * FROM Chantier WHERE ${whereClauses.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  async findWithStats(id) {
    const rows = await this.raw(
      `SELECT c.*,
        COALESCE((SELECT COUNT(*) FROM Tache t WHERE t.id_chantier = c.id_chantier), 0) AS tache_count,
        COALESCE((SELECT COUNT(*) FROM PhotoChantier p WHERE p.id_chantier = c.id_chantier), 0) AS photo_count,
        (SELECT MAX(date_journal) FROM JournalChantier j WHERE j.id_chantier = c.id_chantier) AS dernier_journal_date
      FROM Chantier c
      WHERE c.id_chantier = ?`,
      [id]
    );

    if (!rows.length) {
      throw new NotFoundError('Chantier introuvable');
    }

    return rows[0];
  }

  /**
   * Recalcule la progression d'un chantier basée sur ses tâches feuilles.
   *
   * Sémantique : moyenne pondérée par durée des pourcentages des tâches feuilles
   * (tâches sans enfant via parent_id). Exclut les parents pour éviter le
   * double comptage dans les hiérarchies de sous-tâches.
   *
   * Formule : SUM(pourcentage × duree_jours) / SUM(duree_jours)
   *
   * Garanties :
   * - Aucune tâche feuille → progression = 0
   * - Toutes durées NULL/0 → progression = 0 (NULLIF anti div/0)
   * - Pourcentages aberrants (> 100 ou < 0) → clampés à [0, 100]
   * - Arrondi à 2 décimales pour stabilité affichage
   *
   * @param {number} id - id_chantier
   * @param {Object|null} conn - connexion transactionnelle (optionnelle)
   * @returns {Promise<number>} progression calculée (0-100, 2 décimales)
   */
  async updateProgression(id, conn = null) {
    const rows = await this.raw(
      `SELECT
         COALESCE(
           SUM(pourcentage * duree_jours) / NULLIF(SUM(duree_jours), 0),
           0
         ) AS progression
       FROM Tache t
       WHERE t.id_chantier = ?
         AND NOT EXISTS (
           SELECT 1 FROM Tache child WHERE child.parent_id = t.id_tache
         )`,
      [id],
      conn
    );

    const rawValue = parseFloat(rows[0]?.progression) || 0;
    const clamped = Math.min(100, Math.max(0, rawValue));
    const progression = Math.round(clamped * 100) / 100;

    await this.update(id, { progression }, conn);
    return progression;
  }
}

export const chantierRepo = new ChantierRepository();