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

  async updateProgression(id) {
    const rows = await this.raw(
      'SELECT AVG(pourcentage) AS moyenne FROM Tache WHERE id_chantier = ?',
      [id]
    );

    const progression = rows[0]?.moyenne ? parseFloat(rows[0].moyenne) : 0;
    await this.update(id, { progression });
    return progression;
  }
}

export const chantierRepo = new ChantierRepository();
