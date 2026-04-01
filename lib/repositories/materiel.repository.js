import { BaseRepository } from './base.repository.js';

export class MaterielRepository extends BaseRepository {
  constructor() {
    super('Materiel', 'id_materiel');
  }

  async findByEntreprise(entrepriseId, { page = 1, limit = 20, search, categorie, etat } = {}) {
    const whereClauses = ['id_entreprise = ?'];
    const params = [entrepriseId];

    if (categorie) {
      whereClauses.push('categorie = ?');
      params.push(categorie);
    }

    if (etat) {
      whereClauses.push('etat = ?');
      params.push(etat);
    }

    if (search) {
      whereClauses.push('(nom LIKE ? OR reference LIKE ? OR marque LIKE ?)');
      const likeQuery = `%${search}%`;
      params.push(likeQuery, likeQuery, likeQuery);
    }

    const offset = (page - 1) * limit;

    return this.raw(
      `SELECT * FROM Materiel WHERE ${whereClauses.join(' AND ')} ORDER BY nom ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  async findByChantier(chantierId) {
    return this.raw(
      `SELECT m.*, a.id_affectation, a.date_sortie, a.date_retour_prevue, a.etat_sortie
       FROM Materiel m
       INNER JOIN AffectationMateriel a ON m.id_materiel = a.id_materiel
       WHERE a.id_chantier = ? AND a.date_retour IS NULL
       ORDER BY m.nom ASC`,
      [chantierId]
    );
  }

  async findDisponible(entrepriseId) {
    return this.raw(
      `SELECT * FROM Materiel
       WHERE id_entreprise = ?
         AND etat != 'hors_service'
         AND id_materiel NOT IN (
           SELECT id_materiel FROM AffectationMateriel WHERE date_retour IS NULL
         )
       ORDER BY nom ASC`,
      [entrepriseId]
    );
  }
}

export const materielRepo = new MaterielRepository();
