import { BaseRepository } from './base.repository.js';

export class ReportRepository extends BaseRepository {
  constructor() {
    super('Rapport', 'id_rapport');
  }

  async findByUser(userId, { page = 1, limit = 20, search = '', statut = null, entrepriseId = null, sort = 'date_creation DESC' } = {}) {
    const filters = ['id_utilisateur = ?'];
    const params = [userId];

    if (statut) {
      filters.push('statut = ?');
      params.push(statut);
    }

    if (entrepriseId !== null && entrepriseId !== undefined) {
      filters.push('id_entreprise = ?');
      params.push(entrepriseId);
    }

    if (search) {
      filters.push('(titre LIKE ? OR description LIKE ? OR nom_chantier LIKE ? OR numero_rapport LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    return this.findAll({
      page,
      limit,
      orderBy: sort,
      where: filters.join(' AND '),
      params,
    });
  }

  async findWithCreator(id) {
    const rows = await this.raw(
      `SELECT r.*, u.nom AS createur_nom, u.prenom AS createur_prenom, u.email AS createur_email
       FROM Rapport r
       JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
       WHERE r.id_rapport = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findAllAdmin({ page = 1, limit = 20, search = '', statut = null, entrepriseId = null } = {}) {
    const filters = ['1'];
    const params = [];

    if (statut) {
      filters.push('statut = ?');
      params.push(statut);
    }

    if (entrepriseId !== null && entrepriseId !== undefined) {
      filters.push('id_entreprise = ?');
      params.push(entrepriseId);
    }

    if (search) {
      filters.push('(titre LIKE ? OR description LIKE ? OR nom_chantier LIKE ? OR numero_rapport LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    return this.findAll({
      page,
      limit,
      orderBy: 'date_creation DESC',
      where: filters.join(' AND '),
      params,
    });
  }

  async countByUser(userId) {
    return this.count('id_utilisateur = ?', [userId]);
  }

  async countByStatus() {
    return this.raw('SELECT statut, COUNT(*) AS total FROM Rapport GROUP BY statut');
  }

  async validate(id, adminId, commentaire) {
    return this.raw(
      `UPDATE Rapport SET statut = ?, commentaire_admin = ?, id_validateur = ?, date_validation = NOW(), date_modification = NOW() WHERE id_rapport = ?`,
      ['valide', commentaire, adminId, id]
    );
  }

  async reject(id, adminId, commentaire) {
    return this.raw(
      `UPDATE Rapport SET statut = ?, commentaire_admin = ?, id_validateur = ?, date_validation = NOW(), date_modification = NOW() WHERE id_rapport = ?`,
      ['rejete', commentaire, adminId, id]
    );
  }
}

export const reportRepo = new ReportRepository();
