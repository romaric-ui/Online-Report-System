import { BaseRepository } from './base.repository.js';

export class DepenseRepository extends BaseRepository {
  constructor() {
    super('Depense', 'id_depense');
  }

  async findByChantier(chantierId, { page = 1, limit = 20, categorie, statut } = {}) {
    const whereClauses = ['id_chantier = ?'];
    const params = [chantierId];

    if (categorie) {
      whereClauses.push('categorie = ?');
      params.push(categorie);
    }

    if (statut) {
      whereClauses.push('statut = ?');
      params.push(statut);
    }

    const offset = (page - 1) * limit;

    return this.raw(
      `SELECT * FROM Depense WHERE ${whereClauses.join(' AND ')} ORDER BY date_depense DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  async getTotalByChantier(chantierId) {
    const rows = await this.raw(
      `SELECT COALESCE(SUM(montant), 0) AS total
       FROM Depense
       WHERE id_chantier = ? AND statut = 'validee'`,
      [chantierId]
    );
    return parseFloat(rows[0]?.total ?? 0);
  }
}

export const depenseRepo = new DepenseRepository();
