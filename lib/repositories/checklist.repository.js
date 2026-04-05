import { BaseRepository } from './base.repository.js';
import { NotFoundError } from '../errors/index.js';

export class ChecklistRepository extends BaseRepository {
  constructor() {
    super('ChecklistSecurite', 'id_checklist');
  }

  async findByChantier(chantierId, { page = 1, limit = 20, type_checklist } = {}) {
    const where = ['id_chantier = ?'];
    const params = [chantierId];

    if (type_checklist) {
      where.push('type_checklist = ?');
      params.push(type_checklist);
    }

    const offset = (page - 1) * limit;
    return this.raw(
      `SELECT * FROM ChecklistSecurite WHERE ${where.join(' AND ')} ORDER BY date_checklist DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }

  async findWithItems(id) {
    const rows = await this.raw(
      'SELECT * FROM ChecklistSecurite WHERE id_checklist = ? LIMIT 1',
      [id]
    );
    if (!rows.length) throw new NotFoundError('Checklist introuvable');

    const items = await this.raw(
      'SELECT * FROM ItemChecklist WHERE id_checklist = ? ORDER BY id_item ASC',
      [id]
    );
    return { ...rows[0], items };
  }

  async calculateScore(id) {
    const rows = await this.raw(
      `SELECT
        SUM(CASE WHEN reponse = 'conforme' THEN 1 ELSE 0 END) AS nb_conformes,
        SUM(CASE WHEN reponse != 'non_applicable' THEN 1 ELSE 0 END) AS nb_applicable
       FROM ItemChecklist WHERE id_checklist = ?`,
      [id]
    );
    const { nb_conformes, nb_applicable } = rows[0] || {};
    if (!nb_applicable || parseInt(nb_applicable, 10) === 0) return null;

    const score = (parseInt(nb_conformes, 10) / parseInt(nb_applicable, 10)) * 100;
    await this.update(id, { score: parseFloat(score.toFixed(2)) });
    return score;
  }
}

export const checklistRepo = new ChecklistRepository();
