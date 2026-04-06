import { BaseRepository } from './base.repository.js';
import { connectDB } from '../database.js';

class InvitationRepository extends BaseRepository {
  constructor() {
    super('InvitationEntreprise', 'id_invitation');
  }

  async findByEntreprise(entrepriseId, { statut } = {}) {
    const db = await connectDB();
    let sql = `
      SELECT
        i.*,
        r.nom AS role_nom,
        u.nom AS invite_par_nom, u.prenom AS invite_par_prenom
      FROM InvitationEntreprise i
      INNER JOIN RoleEntreprise r ON i.role_attribue = r.id_role_entreprise
      INNER JOIN Utilisateur u ON i.invite_par = u.id_utilisateur
      WHERE i.id_entreprise = ?
    `;
    const params = [parseInt(entrepriseId, 10)];
    if (statut) {
      sql += ' AND i.statut = ?';
      params.push(statut);
    }
    sql += ' ORDER BY i.created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findByCode(code) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT
         i.*,
         r.nom AS role_nom, r.description AS role_description,
         e.nom AS entreprise_nom
       FROM InvitationEntreprise i
       INNER JOIN RoleEntreprise r ON i.role_attribue = r.id_role_entreprise
       INNER JOIN Entreprise e ON i.id_entreprise = e.id_entreprise
       WHERE i.code_invitation = ?
       LIMIT 1`,
      [code]
    );
    return rows[0] || null;
  }

  async findByEmail(email, entrepriseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT * FROM InvitationEntreprise
       WHERE email = ? AND id_entreprise = ? AND statut = 'en_attente'
       LIMIT 1`,
      [email, parseInt(entrepriseId, 10)]
    );
    return rows[0] || null;
  }

  async expire() {
    const db = await connectDB();
    const [result] = await db.query(
      `UPDATE InvitationEntreprise
       SET statut = 'expiree'
       WHERE statut = 'en_attente' AND date_expiration < NOW()`
    );
    return result.affectedRows;
  }
}

export const invitationRepo = new InvitationRepository();
