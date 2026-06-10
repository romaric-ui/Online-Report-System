import { BaseRepository } from './base.repository.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('Utilisateur', 'id_utilisateur');
  }

  async findByEmail(email) {
    return this.findOneBy('email = ?', [email]);
  }

  async findByGoogleId(providerId) {
    return this.findOneBy('provider_id = ?', [providerId]);
  }

  async createGoogleUser(profile) {
    const data = {
      nom: profile.family_name || profile.name?.split(' ').slice(-1).join(' ') || 'Utilisateur',
      prenom: profile.given_name || profile.name?.split(' ')[0] || 'Google',
      email: profile.email,
      mot_de_passe: null,
      provider: 'google',
      provider_id: profile.id,
      id_role: 2,
      statut: 'actif',
      email_verifie: 1, // ✅ Google a déjà validé l'email côté Google
    };
    return this.create(data);
  }

  async createLocalUser(data) {
    return this.create({
      ...data,
      provider: 'credentials',
      provider_id: null,
      statut: data.statut || 'actif',
      email_verifie: data.email_verifie ?? 0, // ✅ Par défaut non vérifié — OTP requis
    });
  }

  async updateLastLogin(id) {
    return this.raw('UPDATE Utilisateur SET derniere_connexion = NOW() WHERE id_utilisateur = ?', [id]);
  }

  /**
   * Marque l'email comme vérifié et nettoie l'OTP utilisé.
   * À appeler depuis /api/auth/verify-otp après succès.
   */
async markEmailVerified(id, conn = null) {
  return this.raw(
    'UPDATE Utilisateur SET email_verifie = 1, otp_code = NULL, otp_expires_at = NULL WHERE id_utilisateur = ?',
    [id],
    conn
  );
}

  async findAllWithRole({ page = 1, limit = 20, entrepriseId = null } = {}) {
    const offset = (page - 1) * limit;
    let sql = `SELECT u.*, r.nom_role FROM Utilisateur u LEFT JOIN Role r ON u.id_role = r.id_role`;
    const params = [];

    if (entrepriseId !== null && entrepriseId !== undefined) {
      sql += ' WHERE u.id_entreprise = ?';
      params.push(entrepriseId);
    }

    sql += ' ORDER BY u.date_creation DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return this.raw(sql, params);
  }

  async blockUser(id) {
    return this.raw('UPDATE Utilisateur SET statut = ? WHERE id_utilisateur = ?', ['bloque', id]);
  }

  async unblockUser(id) {
    return this.raw('UPDATE Utilisateur SET statut = ? WHERE id_utilisateur = ?', ['actif', id]);
  }
}

export const userRepo = new UserRepository();