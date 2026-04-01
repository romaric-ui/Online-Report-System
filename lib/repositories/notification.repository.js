import { BaseRepository } from './base.repository.js';

export class NotificationRepository extends BaseRepository {
  constructor() {
    super('Notification', 'id_notification');
  }

  async findByUser(userId, { onlyUnread = false } = {}) {
    const where = onlyUnread ? 'id_utilisateur = ? AND lu = 0' : 'id_utilisateur = ?';
    return this.findAll({
      page: 1,
      limit: 100,
      orderBy: 'date_creation DESC',
      where,
      params: [userId],
    });
  }

  async countUnread(userId) {
    return this.count('id_utilisateur = ? AND lu = 0', [userId]);
  }

  async markAsRead(id, userId) {
    return this.raw('UPDATE Notification SET lu = 1, date_lecture = NOW() WHERE id_notification = ? AND id_utilisateur = ?', [id, userId]);
  }

  async markAllAsRead(userId) {
    return this.raw('UPDATE Notification SET lu = 1, date_lecture = NOW() WHERE id_utilisateur = ?', [userId]);
  }
}

export const notifRepo = new NotificationRepository();
