import { BaseRepository } from './base.repository.js';

export class IncidentRepository extends BaseRepository {
  constructor() {
    super('IncidentSecurite', 'id_incident');
  }

  async findByChantier(chantierId, { page = 1, limit = 20, statut, gravite } = {}) {
    const where = ['id_chantier = ?'];
    const params = [chantierId];

    if (statut) {
      where.push('statut = ?');
      params.push(statut);
    }
    if (gravite) {
      where.push('gravite = ?');
      params.push(gravite);
    }

    const offset = (page - 1) * limit;
    return this.raw(
      `SELECT * FROM IncidentSecurite WHERE ${where.join(' AND ')} ORDER BY date_incident DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  async countByGravite(chantierId) {
    return this.raw(
      `SELECT gravite, COUNT(*) AS total FROM IncidentSecurite WHERE id_chantier = ? GROUP BY gravite`,
      [chantierId]
    );
  }
}

export const incidentRepo = new IncidentRepository();
