import ExcelJS from 'exceljs';
import { connectDB } from './database.js';

// ── Style tokens ────────────────────────────────────────────────
const MARINE = 'FF1E3A5F';
const WHITE  = 'FFFFFFFF';
const LIGHT  = 'FFF3F4F6';

const headerStyle = {
  font:      { bold: true, color: { argb: WHITE }, size: 11, name: 'Arial' },
  fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: MARINE } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border:    { bottom: { style: 'thin', color: { argb: MARINE } } },
};

function styleHeaders(sheet) {
  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
}

function zebraRows(sheet) {
  sheet.eachRow((row, i) => {
    if (i > 1 && i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
      });
    }
  });
}

function addSheet(workbook, name, columns, rows) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  rows.forEach((r) => sheet.addRow(r));
  styleHeaders(sheet);
  zebraRows(sheet);
  return sheet;
}

// ── Module handlers ─────────────────────────────────────────────
// Chaque handler : (db, chantierId, dateDebut, dateFin) → { rows }
// ⚠️  Ajuste les noms de colonnes SQL si ta DB diffère

const MODULES = {
  // ── Tâches ──────────────────────────────────────
  taches: {
    sheetName: 'Tâches',
    columns: [
      { header: 'Nom',             key: 'nom',          width: 32 },
      { header: 'Lot',             key: 'lot',          width: 20 },
      { header: 'Début',           key: 'date_debut',   width: 14 },
      { header: 'Fin prévue',      key: 'date_fin',     width: 14 },
      { header: 'Fin réelle',      key: 'date_fin_r',   width: 14 },
      { header: 'Durée (j)',       key: 'duree',        width: 11 },
      { header: 'Progression (%)', key: 'progression',  width: 15 },
      { header: 'Statut',          key: 'statut',       width: 14 },
      { header: 'Priorité',        key: 'priorite',     width: 12 },
      { header: 'Critique',        key: 'critique',     width: 10 },
      { header: 'Responsable',     key: 'responsable',  width: 22 },
    ],
    async query(db, chantierId, dateDebut, dateFin) {
      let sql = `
        SELECT t.nom,
               l.nom AS lot,
               t.date_debut,
               t.date_fin_prevue  AS date_fin,
               t.date_fin_reelle  AS date_fin_r,
               t.duree_jours      AS duree,
               t.pourcentage      AS progression,
               t.statut, t.priorite,
               IF(t.est_critique, 'Oui', 'Non') AS critique,
               CONCAT(u.prenom, ' ', u.nom) AS responsable
        FROM tache t
        LEFT JOIN lot l         ON t.id_lot = l.id_lot
        LEFT JOIN Utilisateur u ON t.assignee_a = u.id_utilisateur
        WHERE t.id_chantier = ?`;
      const params = [chantierId];

      if (dateDebut && dateFin) {
        sql += ' AND t.date_debut <= ? AND t.date_fin_prevue >= ?';
        params.push(dateFin, dateDebut);
      }
      sql += ' ORDER BY t.date_debut ASC';

      const [rows] = await db.query(sql, params);
      return rows;
    },
  },

  // ── Pointage ────────────────────────────────────
  pointage: {
    sheetName: 'Pointage',
    columns: [
      { header: 'Date',         key: 'date',        width: 14 },
      { header: 'Ouvrier',      key: 'ouvrier',     width: 25 },
      { header: 'Poste',       key: 'poste',        width: 20 },
      { header: 'Arrivée',      key: 'arrivee',      width: 10 },
      { header: 'Départ',       key: 'depart',       width: 10 },
      { header: 'Heures',       key: 'heures',       width: 10 },
      { header: 'Statut',       key: 'statut',       width: 10 },
      { header: 'Note',         key: 'note',         width: 30 },
    ],
    async query(db, chantierId, dateDebut, dateFin) {
      let sql = `
        SELECT p.date_pointage AS date,
               CONCAT(o.prenom, ' ', o.nom) AS ouvrier,
               o.poste,
               p.heure_arrivee  AS arrivee,
               p.heure_depart   AS depart,
               p.heures_travaillees AS heures,
               p.statut,
               p.note
        FROM pointage p
        JOIN ouvrier o ON p.id_ouvrier = o.id_ouvrier
        WHERE p.id_chantier = ?`;
      const params = [chantierId];

      if (dateDebut && dateFin) {
        sql += ' AND p.date_pointage BETWEEN ? AND ?';
        params.push(dateDebut, dateFin);
      }
      sql += ' ORDER BY p.date_pointage DESC, ouvrier ASC';

      const [rows] = await db.query(sql, params);
      return rows;
    },
  },

  // ── Dépenses ─────────────────────────────────────
  budget: {
    sheetName: 'Dépenses',
    columns: [
      { header: 'Libellé',      key: 'libelle',      width: 30 },
      { header: 'Catégorie',    key: 'categorie',    width: 16 },
      { header: 'Montant',      key: 'montant',      width: 16 },
      { header: 'Date',         key: 'date_depense', width: 14 },
      { header: 'Fournisseur',  key: 'fournisseur',  width: 22 },
      { header: 'Statut',       key: 'statut',       width: 12 },
    ],
    async query(db, chantierId, dateDebut, dateFin) {
      let sql = `
        SELECT libelle, categorie, montant, date_depense, fournisseur, statut
        FROM depense WHERE id_chantier = ?`;
      const params = [chantierId];

      if (dateDebut && dateFin) {
        sql += ' AND date_depense BETWEEN ? AND ?';
        params.push(dateDebut, dateFin);
      }
      sql += ' ORDER BY date_depense DESC';

      const [rows] = await db.query(sql, params);
      return rows;
    },
  },

  // ── Matériel (niveau entreprise) ──────────────
  materiel: {
    sheetName: 'Matériel',
    columns: [
      { header: 'Nom',           key: 'nom',           width: 25 },
      { header: 'Catégorie',     key: 'categorie',     width: 16 },
      { header: 'Marque',        key: 'marque',        width: 18 },
      { header: 'État',          key: 'etat',          width: 12 },
      { header: 'Référence',    key: 'reference',     width: 18 },
      { header: 'Localisation',  key: 'localisation',  width: 20 },
      { header: 'Maintenance',   key: 'maintenance',   width: 14 },
    ],
    async query(db, chantierId) {
      // Matériel = niveau entreprise, on récupère via le chantier
      const [rows] = await db.query(
        `SELECT m.nom, m.categorie, m.marque, m.etat,
                m.reference, m.localisation,
                m.date_prochaine_maintenance AS maintenance
         FROM materiel m
         JOIN chantier c ON m.id_entreprise = c.id_entreprise
         WHERE c.id_chantier = ?
         ORDER BY m.categorie ASC, m.nom ASC`,
        [chantierId]
      );
      return rows;
    },
  },

  // ── HSE (Incidents + Checklists) ────────────────
  hse: {
    sheetName: 'HSE',
    columns: [
      { header: 'Type',           key: 'type_ligne',   width: 12 },
      { header: 'Date',           key: 'date',         width: 16 },
      { header: 'Nature',         key: 'nature',       width: 22 },
      { header: 'Gravité',        key: 'gravite',      width: 14 },
      { header: 'Description',    key: 'description',  width: 35 },
      { header: 'Lieu',           key: 'lieu',         width: 20 },
      { header: 'Jours arrêt',    key: 'jours_arret',  width: 12 },
      { header: 'Statut',         key: 'statut',       width: 14 },
      { header: 'Déclaré par',    key: 'declarant',    width: 22 },
    ],
    async query(db, chantierId, dateDebut, dateFin) {
      // Incidents
      let sqlInc = `
        SELECT 'Incident' AS type_ligne,
               i.date_incident AS date,
               i.type_incident AS nature,
               i.gravite,
               i.description,
               i.lieu,
               i.jours_arret,
               i.statut,
               CONCAT(u.prenom, ' ', u.nom) AS declarant
        FROM IncidentSecurite i
        LEFT JOIN Utilisateur u ON i.declare_par = u.id_utilisateur
        WHERE i.id_chantier = ?`;
      const paramsInc = [chantierId];

      // Checklists
      let sqlChk = `
        SELECT 'Checklist' AS type_ligne,
               c.date_checklist AS date,
               c.type_checklist AS nature,
               '' AS gravite,
               CONCAT('Score: ', IFNULL(c.score, '—'), '%') AS description,
               '' AS lieu,
               NULL AS jours_arret,
               c.statut,
               CONCAT(u.prenom, ' ', u.nom) AS declarant
        FROM ChecklistSecurite c
        LEFT JOIN Utilisateur u ON c.remplie_par = u.id_utilisateur
        WHERE c.id_chantier = ?`;
      const paramsChk = [chantierId];

      if (dateDebut && dateFin) {
        sqlInc += ' AND i.date_incident BETWEEN ? AND ?';
        sqlChk += ' AND c.date_checklist BETWEEN ? AND ?';
        paramsInc.push(dateDebut, dateFin);
        paramsChk.push(dateDebut, dateFin);
      }

      const [incidents]  = await db.query(sqlInc, paramsInc);
      const [checklists] = await db.query(sqlChk, paramsChk);
      return [...incidents, ...checklists].sort((a, b) => new Date(b.date) - new Date(a.date));
    },
  },

  // ── Journal de chantier ─────────────────────────
  journal: {
    sheetName: 'Journal',
    columns: [
      { header: 'Date',             key: 'date',             width: 14 },
      { header: 'Météo',            key: 'meteo',            width: 14 },
      { header: 'Résumé',           key: 'resume',           width: 30 },
      { header: 'Travaux réalisés', key: 'travaux_realises', width: 40 },
      { header: 'Problèmes',        key: 'problemes',        width: 30 },
      { header: 'Décisions',        key: 'decisions',        width: 30 },
      { header: 'Observations',     key: 'observations',     width: 30 },
    ],
    async query(db, chantierId, dateDebut, dateFin) {
      let sql = `
        SELECT date_journal AS date, meteo, resume, travaux_realises,
               problemes, decisions, observations
        FROM journalchantier WHERE id_chantier = ?`;
      const params = [chantierId];

      if (dateDebut && dateFin) {
        sql += ' AND date_journal BETWEEN ? AND ?';
        params.push(dateDebut, dateFin);
      }
      sql += ' ORDER BY date_journal DESC';

      const [rows] = await db.query(sql, params);
      return rows;
    },
  },

  // ── Ouvriers (niveau entreprise) ──────────────
  equipe: {
    sheetName: 'Ouvriers',
    columns: [
      { header: 'Nom',           key: 'nom',           width: 20 },
      { header: 'Prénom',        key: 'prenom',        width: 20 },
      { header: 'Poste',         key: 'poste',         width: 22 },
      { header: 'Spécialité',    key: 'specialite',    width: 20 },
      { header: 'Téléphone',     key: 'telephone',     width: 18 },
      { header: 'Taux horaire',  key: 'taux_horaire',  width: 14 },
      { header: 'Statut',        key: 'statut',        width: 12 },
      { header: 'Embauche',      key: 'date_embauche', width: 14 },
    ],
    async query(db, chantierId) {
      const [rows] = await db.query(
        `SELECT o.nom, o.prenom, o.poste, o.specialite,
                o.telephone, o.taux_horaire, o.statut, o.date_embauche
         FROM ouvrier o
         JOIN chantier c ON o.id_entreprise = c.id_entreprise
         WHERE c.id_chantier = ?
         ORDER BY o.nom ASC`,
        [chantierId]
      );
      return rows;
    },
  },
};

// ── Générateur principal ────────────────────────────────────────
export async function generateChantierExport({ chantierId, modules, dateDebut, dateFin }) {
  const db = await connectDB();

  // Récupérer les infos du chantier pour la page de garde
  const [chantierRows] = await db.query(
    'SELECT nom, adresse, date_debut, date_fin_prevue, progression FROM chantier WHERE id_chantier = ? LIMIT 1',
    [chantierId]
  );
  const chantier = chantierRows[0];
  if (!chantier) throw new Error('Chantier introuvable');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROJECTRA';
  workbook.created = new Date();

  // ── Page de garde ──────────────────────────────
  const cover = workbook.addWorksheet('Résumé');
  cover.getColumn('A').width = 22;
  cover.getColumn('B').width = 40;

  const titleRow = cover.getRow(1);
  cover.mergeCells('A1:B1');
  titleRow.getCell(1).value = 'PROJECTRA — Export Chantier';
  titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: MARINE }, name: 'Arial' };
  titleRow.height = 36;

  const meta = [
    ['Chantier', chantier.nom],
    ['Adresse', chantier.adresse || '—'],
    ['Début', chantier.date_debut || '—'],
    ['Fin prévue', chantier.date_fin_prevue || '—'],
    ['Progression', chantier.progression != null ? `${chantier.progression}%` : '—'],
    ['Exporté le', new Date().toLocaleDateString('fr-FR')],
    ['Période', dateDebut && dateFin ? `${dateDebut} → ${dateFin}` : 'Toutes les données'],
    ['Modules', modules.join(', ')],
  ];

  meta.forEach(([label, value], i) => {
    const row = cover.getRow(i + 3);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, size: 11, name: 'Arial' };
    row.getCell(2).value = value;
    row.getCell(2).font = { size: 11, name: 'Arial' };
  });

  // ── Onglets par module ─────────────────────────
  const skipped = [];
  for (const mod of modules) {
    const handler = MODULES[mod];
    if (!handler) continue;

    try {
      const rows = await handler.query(db, chantierId, dateDebut, dateFin);
      addSheet(workbook, handler.sheetName, handler.columns, rows);
    } catch (err) {
      console.warn(`⚠️ Export module "${mod}" ignoré :`, err.message);
      skipped.push(`${handler.sheetName} (${err.message})`);
    }
  }

  // Noter les modules ignorés sur la page de garde
  if (skipped.length > 0) {
    const row = cover.getRow(meta.length + 4);
    row.getCell(1).value = 'Modules ignorés';
    row.getCell(1).font = { bold: true, size: 11, name: 'Arial', color: { argb: 'FFEF4444' } };
    row.getCell(2).value = skipped.join(', ');
    row.getCell(2).font = { size: 10, name: 'Arial', color: { argb: 'FFEF4444' } };
  }

  return { workbook, chantierNom: chantier.nom };
}

export const AVAILABLE_MODULES = Object.keys(MODULES);