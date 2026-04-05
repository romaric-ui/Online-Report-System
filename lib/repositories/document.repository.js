import { BaseRepository } from './base.repository.js';

export class DocumentRepository extends BaseRepository {
  constructor() {
    super('DocumentChantier', 'id_document');
  }

  async findByChantier(chantierId, { page = 1, limit = 20, categorie } = {}) {
    const where = ['d.id_chantier = ?'];
    const params = [chantierId];

    if (categorie) {
      where.push('d.categorie = ?');
      params.push(categorie);
    }

    const offset = (page - 1) * limit;
    return this.raw(
      `SELECT d.*,
         u.nom AS uploader_nom, u.prenom AS uploader_prenom
       FROM DocumentChantier d
       LEFT JOIN Utilisateur u ON d.uploaded_by = u.id_utilisateur
       WHERE ${where.join(' AND ')}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  async countByCategorie(chantierId) {
    return this.raw(
      `SELECT categorie, COUNT(*) AS total
       FROM DocumentChantier
       WHERE id_chantier = ?
       GROUP BY categorie`,
      [chantierId]
    );
  }
}

export const documentRepo = new DocumentRepository();
