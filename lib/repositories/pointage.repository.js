import { BaseRepository } from './base.repository.js';

export class PointageRepository extends BaseRepository {
  constructor() {
    super('Pointage', 'id_pointage');
  }

  async findByChantierAndDate(chantierId, date) {
    return this.raw(
      `SELECT p.*, o.nom, o.prenom, o.poste
       FROM Pointage p
       INNER JOIN Ouvrier o ON p.id_ouvrier = o.id_ouvrier
       WHERE p.id_chantier = ? AND p.date_pointage = ?
       ORDER BY o.nom ASC`,
      [chantierId, date]
    );
  }

  async findByOuvrier(ouvrierId, { mois, annee } = {}) {
    const whereClauses = ['id_ouvrier = ?'];
    const params = [ouvrierId];

    if (mois && annee) {
      whereClauses.push('MONTH(date_pointage) = ? AND YEAR(date_pointage) = ?');
      params.push(parseInt(mois, 10), parseInt(annee, 10));
    } else if (annee) {
      whereClauses.push('YEAR(date_pointage) = ?');
      params.push(parseInt(annee, 10));
    }

    return this.raw(
      `SELECT * FROM Pointage WHERE ${whereClauses.join(' AND ')} ORDER BY date_pointage DESC`,
      params
    );
  }

  async calculateHeures(ouvrierId, chantierId, mois, annee) {
    const rows = await this.raw(
      `SELECT COALESCE(SUM(heures_travaillees), 0) AS total_heures
       FROM Pointage
       WHERE id_ouvrier = ?
         AND id_chantier = ?
         AND MONTH(date_pointage) = ?
         AND YEAR(date_pointage) = ?`,
      [ouvrierId, chantierId, parseInt(mois, 10), parseInt(annee, 10)]
    );
    return parseFloat(rows[0]?.total_heures ?? 0);
  }
}

export const pointageRepo = new PointageRepository();
