import { BaseRepository } from './base.repository.js';
import { connectDB } from '../database.js';

export class StockSecuriteRepository extends BaseRepository {
  constructor() {
    super('StockSecurite', 'id_stock');
  }

  async findByChantier(chantierId, { categorie, etat } = {}) {
    const where = ['id_chantier = ?'];
    const params = [chantierId];

    if (categorie) {
      where.push('categorie = ?');
      params.push(categorie);
    }
    if (etat) {
      where.push('etat = ?');
      params.push(etat);
    }

    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT s.*,
              CONCAT(u.prenom, ' ', u.nom) AS responsable_nom
       FROM StockSecurite s
       LEFT JOIN Utilisateur u ON u.id_utilisateur = s.responsable
       WHERE ${where.join(' AND ')}
       ORDER BY s.categorie, s.nom_article`,
      params
    );
    return rows;
  }

  async findAlertesStock(chantierId) {
    const db = await connectDB();
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await db.query(
      `SELECT *,
        CASE
          WHEN quantite <= quantite_min THEN 'rupture'
          WHEN date_peremption IS NOT NULL AND date_peremption <= ? THEN 'perime'
          WHEN date_prochaine_verification IS NOT NULL AND date_prochaine_verification <= ? THEN 'verification_due'
          ELSE NULL
        END AS type_alerte
       FROM StockSecurite
       WHERE id_chantier = ?
         AND (
           quantite <= quantite_min
           OR (date_peremption IS NOT NULL AND date_peremption <= ?)
           OR (date_prochaine_verification IS NOT NULL AND date_prochaine_verification <= ?)
         )
       ORDER BY type_alerte, nom_article`,
      [today, today, chantierId, today, today]
    );
    return rows;
  }

  async findAVerifier(chantierId) {
    const db = await connectDB();
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    const limitStr = limit.toISOString().slice(0, 10);
    const [rows] = await db.query(
      `SELECT * FROM StockSecurite
       WHERE id_chantier = ?
         AND date_prochaine_verification IS NOT NULL
         AND date_prochaine_verification <= ?
       ORDER BY date_prochaine_verification`,
      [chantierId, limitStr]
    );
    return rows;
  }
}

export const stockSecuriteRepo = new StockSecuriteRepository();
