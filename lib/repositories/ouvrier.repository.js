import { BaseRepository } from './base.repository.js';

export class OuvrierRepository extends BaseRepository {
  constructor() {
    super('Ouvrier', 'id_ouvrier');
  }

  async findByEntreprise(entrepriseId, { page = 1, limit = 20, search, statut } = {}) {
    const whereClauses = ['id_entreprise = ?'];
    const params = [entrepriseId];

    if (statut) {
      whereClauses.push('statut = ?');
      params.push(statut);
    }

    if (search) {
      whereClauses.push('(nom LIKE ? OR prenom LIKE ? OR poste LIKE ?)');
      const likeQuery = `%${search}%`;
      params.push(likeQuery, likeQuery, likeQuery);
    }

    const offset = (page - 1) * limit;

    return this.raw(
      `SELECT * FROM Ouvrier WHERE ${whereClauses.join(' AND ')} ORDER BY nom ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  async findByChantier(chantierId) {
    return this.raw(
      `SELECT o.*, a.id_affectation, a.date_debut, a.date_fin, a.role_chantier
       FROM Ouvrier o
       INNER JOIN AffectationChantier a ON o.id_ouvrier = a.id_ouvrier
       WHERE a.id_chantier = ?
       ORDER BY o.nom ASC`,
      [chantierId]
    );
  }
}

export const ouvrierRepo = new OuvrierRepository();
