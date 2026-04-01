import { BaseRepository } from './base.repository.js';

export class JournalRepository extends BaseRepository {
  constructor() {
    super('JournalChantier', 'id_journal');
  }

  async findByChantier(chantierId, { page = 1, limit = 30 } = {}) {
    const offset = (page - 1) * limit;
    return this.raw(
      `SELECT j.*, u.nom AS redacteur_nom, u.prenom AS redacteur_prenom
      FROM JournalChantier j
      JOIN Utilisateur u ON j.redige_par = u.id_utilisateur
      WHERE j.id_chantier = ?
      ORDER BY j.date_journal DESC
      LIMIT ? OFFSET ?`,
      [chantierId, parseInt(limit, 10), parseInt(offset, 10)]
    );
  }
}

export const journalRepo = new JournalRepository();
