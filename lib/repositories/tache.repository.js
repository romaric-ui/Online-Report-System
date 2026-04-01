import { BaseRepository } from './base.repository.js';

export class TacheRepository extends BaseRepository {
  constructor() {
    super('Tache', 'id_tache');
  }

  async findByChantier(chantierId, { statut, lotId } = {}) {
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
      params
    );
  }

  async countByStatut(chantierId) {
    const rows = await this.raw(
      'SELECT statut, COUNT(*) AS count FROM Tache WHERE id_chantier = ? GROUP BY statut',
      [chantierId]
    );

    return rows.reduce((acc, row) => {
      acc[row.statut] = row.count;
      return acc;
    }, {});
  }
}

export const tacheRepo = new TacheRepository();
