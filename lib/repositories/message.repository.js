import { BaseRepository } from './base.repository.js';

export class MessageRepository extends BaseRepository {
  constructor() {
    super('Message', 'id_message');
  }

  async findAll({ page = 1, limit = 20, statut = null } = {}) {
    const filters = ['1'];
    const params = [];

    if (statut) {
      filters.push('statut = ?');
      params.push(statut);
    }

    return super.findAll({
      page,
      limit,
      orderBy: 'date_creation DESC',
      where: filters.join(' AND '),
      params,
    });
  }

  async reply(id, reponse, adminId) {
    void adminId;
    return this.raw(
      'UPDATE Message SET statut = ?, reponse_admin = ?, date_reponse = NOW() WHERE id_message = ?',
      ['repondu', reponse, id]
    );
  }

  async markAsRead(id) {
    return this.raw(
      'UPDATE Message SET statut = ?, date_lecture = NOW() WHERE id_message = ?',
      ['lu', id]
    );
  }
}

export const messageRepo = new MessageRepository();
