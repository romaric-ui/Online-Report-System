import { BaseRepository } from './base.repository.js';

export class BudgetRepository extends BaseRepository {
  constructor() {
    super('BudgetChantier', 'id_budget');
  }

  async findByChantier(chantierId) {
    return this.findOneBy('id_chantier = ?', [chantierId]);
  }

  async getSynthese(chantierId) {
    const rows = await this.raw(
      `SELECT
         b.budget_total,
         b.devise,
         COALESCE(SUM(CASE WHEN d.statut = 'validee' THEN d.montant ELSE 0 END), 0) AS total_depense_validee,
         COALESCE(SUM(CASE WHEN d.statut = 'en_attente' THEN d.montant ELSE 0 END), 0) AS total_depense_en_attente
       FROM BudgetChantier b
       LEFT JOIN Depense d ON d.id_chantier = b.id_chantier
       WHERE b.id_chantier = ?
       GROUP BY b.id_budget`,
      [chantierId]
    );

    if (!rows.length) return null;

    const { budget_total, devise, total_depense_validee, total_depense_en_attente } = rows[0];
    const reste = parseFloat(budget_total) - parseFloat(total_depense_validee);
    const pourcentage_consomme = budget_total > 0
      ? parseFloat(((total_depense_validee / budget_total) * 100).toFixed(1))
      : 0;

    return {
      budget_total: parseFloat(budget_total),
      total_depense_validee: parseFloat(total_depense_validee),
      total_depense_en_attente: parseFloat(total_depense_en_attente),
      reste,
      pourcentage_consomme,
      devise,
    };
  }

  async getDepensesByCategorie(chantierId) {
    return this.raw(
      `SELECT categorie, SUM(montant) AS total, COUNT(*) AS nb_depenses
       FROM Depense
       WHERE id_chantier = ? AND statut = 'validee'
       GROUP BY categorie
       ORDER BY total DESC`,
      [chantierId]
    );
  }
}

export const budgetRepo = new BudgetRepository();
