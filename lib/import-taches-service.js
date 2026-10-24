import ExcelJS from 'exceljs';
import { connectDB } from './database.js';
import { chantierRepo } from './repositories/chantier.repository.js';

/**
 * Résout un nom de lot en id_lot pour un chantier (création si inexistant).
 * Retourne null si le nom est vide.
 */
export async function resolveLotId(chantierId, lotName) {
  const name = String(lotName ?? '').trim();
  if (!name) return null;
  const db = await connectDB();
  const [rows] = await db.query(
    'SELECT id_lot FROM Lot WHERE id_chantier = ? AND LOWER(nom) = LOWER(?) LIMIT 1', [chantierId, name]
  );
  if (rows.length) return rows[0].id_lot;
  const [result] = await db.query('INSERT INTO Lot (id_chantier, nom) VALUES (?, ?)', [chantierId, name]);
  return result.insertId;
}

// ── Colonnes attendues ──────────────────────────────────────────
const COLUMNS = [
  { key: 'nom',           header: 'Nom *',           required: true,  width: 30 },
  { key: 'lot',           header: 'Lot',             required: false, width: 20 },
  { key: 'description',   header: 'Description',     required: false, width: 35 },
  { key: 'date_debut',    header: 'Début (AAAA-MM-JJ)', required: false, width: 18 },
  { key: 'date_fin_prevue', header: 'Fin prévue (AAAA-MM-JJ)', required: false, width: 18 },
  { key: 'duree_jours',   header: 'Durée (jours)',   required: false, width: 14 },
  { key: 'priorite',      header: 'Priorité',        required: false, width: 14 },
  { key: 'statut',        header: 'Statut',          required: false, width: 14 },
  { key: 'pourcentage',   header: 'Progression (%)', required: false, width: 14 },
];

const VALID_STATUTS   = ['a_faire', 'en_cours', 'en_attente', 'termine'];
const VALID_PRIORITES = ['basse', 'normale', 'haute', 'urgente'];

// ── Génération du template Excel ────────────────────────────────
export async function generateImportTemplate(chantierId) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROJECTRA';

  // Récupérer les lots existants du chantier
  let existingLots = [];
  if (chantierId) {
    const db = await connectDB();
    const [rows] = await db.query('SELECT nom FROM Lot WHERE id_chantier = ? ORDER BY nom', [chantierId]);
    existingLots = rows.map((r) => r.nom);
  }

  const sheet = workbook.addWorksheet('Tâches à importer');

  // Headers
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  sheet.getRow(1).height = 32;

  // Style par défaut : wrap text
  sheet.columns.forEach((col) => {
    col.alignment = { vertical: 'top', wrapText: true };
  });

  // Format date sur les colonnes date
  const debutCol = COLUMNS.findIndex((c) => c.key === 'date_debut') + 1;
  const finCol   = COLUMNS.findIndex((c) => c.key === 'date_fin_prevue') + 1;
  sheet.getColumn(debutCol).numFmt = 'yyyy-mm-dd';
  sheet.getColumn(finCol).numFmt   = 'yyyy-mm-dd';

  // Ligne exemple (avec de vrais objets Date pour le format Excel)
  const exampleRow = sheet.addRow({
    nom: 'Fondations bâtiment A',
    lot: existingLots[0] || 'Gros œuvre',
    description: 'Coulage des fondations superficielles',
    date_debut: new Date(2026, 6, 1),      // 01/07/2026
    date_fin_prevue: new Date(2026, 6, 15), // 15/07/2026
    duree_jours: 10,
    priorite: 'haute',
    statut: 'a_faire',
    pourcentage: 0,
  });
  exampleRow.eachCell((cell) => {
    cell.font = { italic: true, color: { argb: 'FF94A3B8' }, size: 10 };
    cell.alignment = { vertical: 'top', wrapText: true };
  });

  // ── Data validation (lignes 3 à 500) ──────────
  const prioriteCol = COLUMNS.findIndex((c) => c.key === 'priorite') + 1;
  const statutCol   = COLUMNS.findIndex((c) => c.key === 'statut') + 1;
  const lotCol      = COLUMNS.findIndex((c) => c.key === 'lot') + 1;
  const dureeCol    = COLUMNS.findIndex((c) => c.key === 'duree_jours') + 1;
  const pctCol      = COLUMNS.findIndex((c) => c.key === 'pourcentage') + 1;

  for (let row = 3; row <= 500; row++) {
    // Priorité — liste déroulante
    sheet.getCell(row, prioriteCol).dataValidation = {
      type: 'list', formulae: [`"${VALID_PRIORITES.join(',')}"`], showErrorMessage: true,
      errorTitle: 'Valeur invalide', error: `Choisissez : ${VALID_PRIORITES.join(', ')}`,
    };

    // Statut — liste déroulante
    sheet.getCell(row, statutCol).dataValidation = {
      type: 'list', formulae: [`"${VALID_STATUTS.join(',')}"`], showErrorMessage: true,
      errorTitle: 'Valeur invalide', error: `Choisissez : ${VALID_STATUTS.join(', ')}`,
    };

    // Date début — validation date
    sheet.getCell(row, debutCol).dataValidation = {
      type: 'date', operator: 'between',
      formulae: [new Date(2020, 0, 1), new Date(2040, 11, 31)],
      showErrorMessage: true, showInputMessage: true,
      promptTitle: 'Date', prompt: 'Sélectionnez ou saisissez une date (AAAA-MM-JJ)',
      errorTitle: 'Date invalide', error: 'Entrez une date entre 2020 et 2040',
    };

    // Date fin — validation date
    sheet.getCell(row, finCol).dataValidation = {
      type: 'date', operator: 'between',
      formulae: [new Date(2020, 0, 1), new Date(2040, 11, 31)],
      showErrorMessage: true, showInputMessage: true,
      promptTitle: 'Date', prompt: 'Sélectionnez ou saisissez une date (AAAA-MM-JJ)',
      errorTitle: 'Date invalide', error: 'Entrez une date entre 2020 et 2040',
    };

    // Durée — entier positif
    sheet.getCell(row, dureeCol).dataValidation = {
      type: 'whole', operator: 'between', formulae: [1, 9999],
      showErrorMessage: true,
      errorTitle: 'Durée invalide', error: 'Entrez un nombre entier positif',
    };

    // Progression — entre 0 et 100
    sheet.getCell(row, pctCol).dataValidation = {
      type: 'decimal', operator: 'between', formulae: [0, 100],
      showErrorMessage: true,
      errorTitle: 'Valeur invalide', error: 'Entrez un nombre entre 0 et 100',
    };

    // Lot — liste déroulante si des lots existent
    if (existingLots.length > 0) {
      sheet.getCell(row, lotCol).dataValidation = {
        type: 'list', formulae: [`"${existingLots.join(',')}"`],
        showErrorMessage: false, // Pas bloquer — l'utilisateur peut saisir un nouveau lot
      };
    }
  }

  // Onglet aide
  const help = workbook.addWorksheet('Aide');
  help.getColumn('A').width = 22;
  help.getColumn('B').width = 55;
  help.getCell('A1').value = 'Colonne';
  help.getCell('B1').value = 'Description';
  help.getRow(1).font = { bold: true };
  help.columns.forEach((col) => { col.alignment = { vertical: 'top', wrapText: true }; });

  const helpData = [
    ['Nom *', 'Nom de la tâche (obligatoire)'],
    ['Lot', `Nom du lot — liste déroulante avec les lots existants. Vous pouvez aussi saisir un nouveau lot, il sera créé automatiquement.${existingLots.length > 0 ? '\nLots existants : ' + existingLots.join(', ') : ''}`],
    ['Description', 'Description détaillée de la tâche'],
    ['Début', 'Date de début — cliquez sur la cellule et utilisez le calendrier Excel, ou saisissez au format AAAA-MM-JJ'],
    ['Fin prévue', 'Date de fin prévue — même format que Début'],
    ['Durée (jours)', 'Nombre entier positif, minimum 1'],
    ['Priorité', `Liste déroulante : ${VALID_PRIORITES.join(' / ')} — défaut : normale`],
    ['Statut', `Liste déroulante : ${VALID_STATUTS.join(' / ')} — défaut : a_faire`],
    ['Progression (%)', 'Nombre entre 0 et 100, défaut 0'],
  ];
  helpData.forEach(([col, desc], i) => {
    help.getCell(`A${i + 2}`).value = col;
    help.getCell(`B${i + 2}`).value = desc;
  });

  return workbook;
}

// ── Parsing du fichier uploadé ──────────────────────────────────
export async function parseImportFile(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase();

  if (ext === 'csv' || ext === 'tsv') {
    return parseCSV(buffer, ext === 'tsv' ? '\t' : detectSeparator(buffer));
  }

  // xlsx
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.getWorksheet(1);
  if (!sheet || sheet.rowCount < 2) return [];

  // Lire les headers pour mapper les colonnes
  const headerRow = sheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || '').trim().toLowerCase();
    const match = COLUMNS.find((c) =>
      val.includes(c.key) || c.header.toLowerCase().includes(val) || val.includes(c.header.toLowerCase().replace(' *', ''))
    );
    if (match) headerMap[colNumber] = match.key;
  });

  // Fallback : si pas de mapping trouvé, mapper par position
  if (Object.keys(headerMap).length === 0) {
    COLUMNS.forEach((c, i) => { headerMap[i + 1] = c.key; });
  }

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 1) return; // skip header

    const data = {};
    let hasData = false;

    Object.entries(headerMap).forEach(([colNum, key]) => {
      let val = row.getCell(parseInt(colNum, 10)).value;
      if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
      if (val && typeof val === 'object' && val.text) val = val.text;
      if (val !== null && val !== undefined && val !== '') {
        data[key] = val;
        hasData = true;
      }
    });

    if (hasData) rows.push({ line: rowNumber, data });
  });

  return rows;
}

function detectSeparator(buffer) {
  const firstLine = Buffer.from(buffer).toString('utf-8').split('\n')[0];
  if (firstLine.includes('\t')) return '\t';
  if (firstLine.includes(';')) return ';';
  return ',';
}

function parseCSV(buffer, separator) {
  const text = Buffer.from(buffer).toString('utf-8');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0], separator).map((h) => h.toLowerCase());
  const keyMap = headers.map((h) => {
    const match = COLUMNS.find((c) =>
      h.includes(c.key) || c.header.toLowerCase().includes(h) || h.includes(c.header.toLowerCase().replace(' *', ''))
    );
    return match ? match.key : null;
  });

  // Fallback par position
  if (keyMap.every((k) => k === null)) {
    COLUMNS.forEach((c, i) => { if (i < keyMap.length) keyMap[i] = c.key; });
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i], separator);
    const data = {};
    let hasData = false;

    keyMap.forEach((key, j) => {
      if (key && values[j] && values[j] !== '') {
        data[key] = values[j];
        hasData = true;
      }
    });

    if (hasData) rows.push({ line: i + 1, data });
  }

  return rows;
}

// Découpe une ligne CSV en respectant les champs entre guillemets ("a, b" ou "il dit ""oui""")
function splitCSVLine(line, separator) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === separator) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

// ── Validation + insertion ──────────────────────────────────────
const EXAMPLE_ROW_NAME = 'fondations bâtiment a'; // ligne exemple du template à ignorer

export async function importTaches(chantierId, parsedRows) {
  const db = await connectDB();
  const errors = [];
  const created = [];
  const skipped = [];

  // Cache des lots existants pour ce chantier
  const [existingLots] = await db.query(
    'SELECT id_lot, nom FROM Lot WHERE id_chantier = ?', [chantierId]
  );
  const lotCache = new Map(existingLots.map((l) => [l.nom.toLowerCase(), l.id_lot]));

  // Cache des tâches existantes (détection doublons par nom)
  const [existingTaches] = await db.query(
    'SELECT nom FROM Tache WHERE id_chantier = ?', [chantierId]
  );
  const existingNames = new Set(existingTaches.map((t) => t.nom.toLowerCase().trim()));

  for (const { line, data } of parsedRows) {
    const rowErrors = [];

    // Nom obligatoire
    const nom = String(data.nom || '').trim();
    if (!nom) { errors.push({ line, errors: ['Nom obligatoire'] }); continue; }

    // Ignorer la ligne exemple du template
    if (nom.toLowerCase() === EXAMPLE_ROW_NAME) continue;

    // Doublon : tâche avec le même nom déjà dans ce chantier
    if (existingNames.has(nom.toLowerCase())) {
      skipped.push({ line, nom });
      continue;
    }

    // Dates
    const dateDebut = parseDate(data.date_debut);
    const dateFin   = parseDate(data.date_fin_prevue);

    if (data.date_debut && !dateDebut) rowErrors.push('Date début invalide (AAAA-MM-JJ)');
    if (data.date_fin_prevue && !dateFin) rowErrors.push('Date fin invalide (AAAA-MM-JJ)');

    // Durée
    const duree = data.duree_jours ? parseInt(data.duree_jours, 10) : 1;
    if (isNaN(duree) || duree < 0) rowErrors.push('Durée invalide');

    // Priorité
    const priorite = data.priorite ? String(data.priorite).toLowerCase().trim() : 'normale';
    if (!VALID_PRIORITES.includes(priorite)) rowErrors.push(`Priorité invalide (${VALID_PRIORITES.join('/')})`);

    // Statut
    const statut = data.statut ? String(data.statut).toLowerCase().trim() : 'a_faire';
    if (!VALID_STATUTS.includes(statut)) rowErrors.push(`Statut invalide (${VALID_STATUTS.join('/')})`);

    // Pourcentage
    let pourcentage = data.pourcentage != null ? parseFloat(data.pourcentage) : 0;
    if (isNaN(pourcentage) || pourcentage < 0 || pourcentage > 100) rowErrors.push('Progression entre 0 et 100');

    if (rowErrors.length > 0) { errors.push({ line, errors: rowErrors }); continue; }

    // Même invariant que tacheRepo : une tâche terminée est à 100 %
    if (statut === 'termine') pourcentage = 100;

    // Résoudre le lot (créer si inexistant)
    let idLot = null;
    if (data.lot) {
      const lotName = String(data.lot).trim();
      const lotKey = lotName.toLowerCase();

      if (lotCache.has(lotKey)) {
        idLot = lotCache.get(lotKey);
      } else {
        const [result] = await db.query(
          'INSERT INTO Lot (id_chantier, nom) VALUES (?, ?)', [chantierId, lotName]
        );
        idLot = result.insertId;
        lotCache.set(lotKey, idLot);
      }
    }

    // Insérer la tâche
    try {
      const [result] = await db.query(
        `INSERT INTO Tache (id_chantier, id_lot, nom, description, date_debut, date_fin_prevue,
                            duree_jours, priorite, statut, pourcentage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [chantierId, idLot, nom, data.description || null, dateDebut, dateFin, duree, priorite, statut, pourcentage]
      );
      created.push({ line, id_tache: result.insertId, nom });
      existingNames.add(nom.toLowerCase()); // Éviter les doublons dans le même fichier
    } catch (err) {
      errors.push({ line, errors: [`Erreur SQL : ${err.message}`] });
    }
  }

  // Les insertions directes contournent tacheRepo : recalculer la progression du chantier
  if (created.length > 0) await chantierRepo.updateProgression(chantierId);

  return { total: parsedRows.length, created: created.length, skipped: skipped.length, errors };
}

function parseDate(val) {
  if (!val) return null;

  // Objet Date JavaScript (retourné par ExcelJS pour les cellules date)
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString().split('T')[0];
  }

  const str = String(val).trim();

  // Format AAAA-MM-JJ
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : str;
  }

  // Date Excel (nombre de jours depuis 1900)
  const num = Number(str);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const d = new Date((num - 25569) * 86400000);
    return d.toISOString().split('T')[0];
  }

  // Format JJ/MM/AAAA
  const match = str.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  return null;
}