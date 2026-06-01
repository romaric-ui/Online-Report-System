import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'onlinereports',
  port: 3306,
});

console.log('✅ Connecté à la base de données');

try {
  // ── 1. Entreprise démo ──────────────────────────────────────────────────
  const [entrepriseResult] = await db.query(
    `INSERT INTO entreprise (nom, slug, pays, telephone, email_contact, couleur_principale, actif)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nom = nom`,
    ['SGTEC Démo', 'sgtec-demo', 'Bénin', '+229 97 00 00 00', 'demo@sgtec.com', '#2563eb', 1]
  );

  let entrepriseId;
  if (entrepriseResult.insertId === 0) {
    const [rows] = await db.query(`SELECT id_entreprise FROM entreprise WHERE slug = 'sgtec-demo'`);
    entrepriseId = rows[0].id_entreprise;
    console.log(`ℹ️  Entreprise démo déjà existante (id: ${entrepriseId})`);
  } else {
    entrepriseId = entrepriseResult.insertId;
    console.log(`✅ Entreprise démo créée (id: ${entrepriseId})`);
  }

  // ── 2. Chantier démo ────────────────────────────────────────────────────
  const [chantierResult] = await db.query(
    `INSERT INTO Chantier (nom, description, adresse, ville, pays, statut, date_debut, date_fin_prevue,
      budget_prevu, progression, client_nom, id_entreprise, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nom = nom`,
    [
      'Construction Villa R+2 — Cotonou',
      'Construction d\'une villa résidentielle R+2 de 280m² avec piscine et espace vert. Projet haut standing pour client privé.',
      'Quartier Fidjrossè',
      'Cotonou',
      'Bénin',
      'en_cours',
      '2024-01-15',
      '2024-10-30',
      45000000,
      67,
      'Famille ADANDE',
      entrepriseId,
      1,
    ]
  );

  let chantierId;
  if (chantierResult.insertId === 0) {
    const [rows] = await db.query(
      `SELECT id_chantier FROM Chantier WHERE id_entreprise = ? AND is_demo = 1 LIMIT 1`,
      [entrepriseId]
    );
    chantierId = rows[0].id_chantier;
    console.log(`ℹ️  Chantier démo déjà existant (id: ${chantierId})`);
  } else {
    chantierId = chantierResult.insertId;
    console.log(`✅ Chantier démo créé (id: ${chantierId})`);
  }

  // ── 3. Tâches ───────────────────────────────────────────────────────────
  const taches = [
    { nom: 'Terrassement et fouilles', statut: 'termine', pourcentage: 100, priorite: 'haute', date_debut: '2024-01-15', date_fin_prevue: '2024-01-25', duree_jours: 10 },
    { nom: 'Fondations semelles filantes', statut: 'termine', pourcentage: 100, priorite: 'haute', date_debut: '2024-01-26', date_fin_prevue: '2024-02-10', duree_jours: 15 },
    { nom: 'Dallage RDC', statut: 'termine', pourcentage: 100, priorite: 'haute', date_debut: '2024-02-11', date_fin_prevue: '2024-02-20', duree_jours: 9 },
    { nom: 'Maçonnerie RDC', statut: 'termine', pourcentage: 100, priorite: 'haute', date_debut: '2024-02-21', date_fin_prevue: '2024-03-15', duree_jours: 23 },
    { nom: 'Plancher haut RDC', statut: 'termine', pourcentage: 100, priorite: 'haute', date_debut: '2024-03-16', date_fin_prevue: '2024-03-30', duree_jours: 14 },
    { nom: 'Maçonnerie R+1', statut: 'termine', pourcentage: 100, priorite: 'haute', date_debut: '2024-04-01', date_fin_prevue: '2024-04-25', duree_jours: 24 },
    { nom: 'Plancher haut R+1', statut: 'termine', pourcentage: 100, priorite: 'haute', date_debut: '2024-04-26', date_fin_prevue: '2024-05-10', duree_jours: 14 },
    { nom: 'Maçonnerie R+2', statut: 'en_cours', pourcentage: 75, priorite: 'haute', date_debut: '2024-05-11', date_fin_prevue: '2024-06-05', duree_jours: 25 },
    { nom: 'Toiture et charpente', statut: 'a_faire', pourcentage: 0, priorite: 'haute', date_debut: '2024-06-06', date_fin_prevue: '2024-06-30', duree_jours: 24 },
    { nom: 'Plomberie et sanitaires', statut: 'en_cours', pourcentage: 40, priorite: 'moyenne', date_debut: '2024-04-01', date_fin_prevue: '2024-07-15', duree_jours: 105 },
    { nom: 'Installation électrique', statut: 'en_cours', pourcentage: 35, priorite: 'moyenne', date_debut: '2024-04-15', date_fin_prevue: '2024-07-30', duree_jours: 106 },
    { nom: 'Enduits et crépissage', statut: 'a_faire', pourcentage: 0, priorite: 'normale', date_debut: '2024-07-01', date_fin_prevue: '2024-08-15', duree_jours: 45 },
    { nom: 'Carrelage et revêtements', statut: 'a_faire', pourcentage: 0, priorite: 'normale', date_debut: '2024-08-01', date_fin_prevue: '2024-09-15', duree_jours: 45 },
    { nom: 'Peinture intérieure et extérieure', statut: 'a_faire', pourcentage: 0, priorite: 'normale', date_debut: '2024-09-01', date_fin_prevue: '2024-10-01', duree_jours: 30 },
    { nom: 'Aménagements extérieurs et piscine', statut: 'a_faire', pourcentage: 0, priorite: 'basse', date_debut: '2024-09-15', date_fin_prevue: '2024-10-25', duree_jours: 40 },
  ];

  for (const t of taches) {
    await db.query(
      `INSERT INTO Tache (nom, statut, pourcentage, priorite, date_debut, date_fin_prevue, duree_jours, id_chantier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.nom, t.statut, t.pourcentage, t.priorite, t.date_debut, t.date_fin_prevue, t.duree_jours, chantierId]
    );
  }
  console.log(`✅ ${taches.length} tâches créées`);

  // ── 4. Ouvriers ─────────────────────────────────────────────────────────
  const ouvriers = [
    { nom: 'AHOUANSOU', prenom: 'Théodore', poste: 'Chef de chantier', specialite: 'Génie Civil' },
    { nom: 'DOSSOU', prenom: 'Alphonse', poste: 'Maçon', specialite: 'Maçonnerie' },
    { nom: 'GBAGUIDI', prenom: 'Sylvain', poste: 'Maçon', specialite: 'Maçonnerie' },
    { nom: 'HOUNSINOU', prenom: 'Firmin', poste: 'Ferrailleur', specialite: 'Ferraillage' },
    { nom: 'SOSSOU', prenom: 'Narcisse', poste: 'Électricien', specialite: 'Électricité' },
    { nom: 'AGBOSSOU', prenom: 'Celestin', poste: 'Plombier', specialite: 'Plomberie' },
    { nom: 'AZONDEKON', prenom: 'Patrice', poste: 'Manœuvre', specialite: 'Général' },
    { nom: 'TOKPANOU', prenom: 'Gilles', poste: 'Manœuvre', specialite: 'Général' },
  ];

  const ouvrierIds = [];
  for (const o of ouvriers) {
    const [res] = await db.query(
      `INSERT INTO Ouvrier (nom, prenom, poste, specialite, id_entreprise)
       VALUES (?, ?, ?, ?, ?)`,
      [o.nom, o.prenom, o.poste, o.specialite, entrepriseId]
    );
    ouvrierIds.push(res.insertId);
    await db.query(
      `INSERT INTO AffectationChantier (id_ouvrier, id_chantier, date_debut)
   VALUES (?, ?, ?)`,
      [res.insertId, chantierId, '2024-01-15']
    );

  }
  console.log(`✅ ${ouvriers.length} ouvriers créés et affectés`);

  // ── 5. Pointage (30 derniers jours) ─────────────────────────────────────
  const today = new Date();
  for (let i = 30; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue; // pas de dimanche

    for (const ouvrierIdItem of ouvrierIds) {
      const present = Math.random() > 0.15; // 85% de présence
      if (present) {
        await db.query(
          `INSERT INTO Pointage (id_ouvrier, id_chantier, date_pointage, statut, heures_travaillees)
           VALUES (?, ?, ?, ?, ?)`,
          [ouvrierIdItem, chantierId, dateStr, 'present', 8]
        );
      }
    }
  }
  console.log(`✅ Pointage sur 30 jours créé`);

  // ── 6. Budget & Dépenses ────────────────────────────────────────────────
  const depenses = [
    { description: 'Achat ciment (500 sacs)', montant: 3500000, categorie: 'materiaux', date_depense: '2024-01-20', statut: 'validee' },
    { description: 'Achat fer à béton 12mm', montant: 2800000, categorie: 'materiaux', date_depense: '2024-02-05', statut: 'validee' },
    { description: 'Location grue mobile', montant: 1200000, categorie: 'materiel', date_depense: '2024-02-15', statut: 'validee' },
    { description: 'Salaires équipe — Février', montant: 2400000, categorie: 'main_oeuvre', date_depense: '2024-02-28', statut: 'validee' },
    { description: 'Achat parpaings (2000 unités)', montant: 1600000, categorie: 'materiaux', date_depense: '2024-03-10', statut: 'validee' },
    { description: 'Salaires équipe — Mars', montant: 2400000, categorie: 'main_oeuvre', date_depense: '2024-03-31', statut: 'validee' },
    { description: 'Achat sable et gravier', montant: 800000, categorie: 'materiaux', date_depense: '2024-04-08', statut: 'validee' },
    { description: 'Fournitures électriques', montant: 1500000, categorie: 'materiaux', date_depense: '2024-04-20', statut: 'validee' },
    { description: 'Salaires équipe — Avril', montant: 2400000, categorie: 'main_oeuvre', date_depense: '2024-04-30', statut: 'validee' },
    { description: 'Achat tuiles toiture', montant: 1800000, categorie: 'materiaux', date_depense: '2024-05-15', statut: 'en_attente' },
    { description: 'Salaires équipe — Mai', montant: 2400000, categorie: 'main_oeuvre', date_depense: '2024-05-31', statut: 'validee' },
    { description: 'Location bétonnière', montant: 450000, categorie: 'materiel', date_depense: '2024-06-02', statut: 'en_attente' },
  ];

  for (const d of depenses) {
    await db.query(
      `INSERT INTO Depense (libelle, montant, categorie, date_depense, statut, id_chantier)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [d.description, d.montant, d.categorie, d.date_depense, d.statut, chantierId]
    );
  }
  console.log(`✅ ${depenses.length} dépenses créées`);

  // ── 7. Journal de chantier ───────────────────────────────────────────────
  const journaux = [
    { date: '2024-05-27', meteo: 'Ensoleillé', travaux: 'Maçonnerie R+2 niveau 3 — pose parpaings rangées 15 à 18. Ferraillage poteaux P12 et P13 terminé.', problemes: 'Livraison ciment retardée de 2h', decisions: 'Commande urgente ciment supplémentaire' },
    { date: '2024-05-28', meteo: 'Nuageux', travaux: 'Coulage béton poteaux P12, P13, P14. Mise en place coffrages linteaux fenêtres façade Nord.', problemes: '', decisions: 'Planning coffrages revu pour semaine prochaine' },
    { date: '2024-05-29', meteo: 'Pluie légère', travaux: 'Arrêt coulage béton le matin. Reprise l\'après-midi. Pose parpaings rangées 19 à 21.', problemes: 'Pluie matinale — arrêt 3h', decisions: 'Récupération samedi matin' },
    { date: '2024-05-30', meteo: 'Ensoleillé', travaux: 'Maçonnerie R+2 avancement 80%. Installation réservations électriques étage.', problemes: '', decisions: '' },
    { date: '2024-05-31', meteo: 'Ensoleillé', travaux: 'Finition maçonnerie R+2. Préparation coffrage plancher haut R+2.', problemes: 'Manque 2 ouvriers absents', decisions: 'Remplacement temporaire prévu lundi' },
  ];

  for (const j of journaux) {
    await db.query(
      `INSERT INTO JournalChantier (date_journal, meteo, travaux_realises, problemes, decisions, id_chantier)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [j.date, j.meteo, j.travaux, j.problemes, j.decisions, chantierId]
    );
  }
  console.log(`✅ ${journaux.length} entrées journal créées`);

  // ── 8. Incidents HSE ─────────────────────────────────────────────────────
  const incidents = [
    { type_incident: 'accident', date_incident: '2024-03-12', gravite: 'mineur', statut: 'clos', description: 'Ouvrier a glissé sur échafaudage. Légère entorse cheville. Soins sur place. Reprise travail J+3.', lieu: 'Échafaudage R+1', mesures_immediates: 'Soins premiers secours sur place', declare_par: 1 },
    { type_incident: 'situation_dangereuse', date_incident: '2024-04-05', gravite: 'mineur', statut: 'clos', description: 'Deux ouvriers sans lunettes de protection lors du coulage. Avertissement verbal. EPI fournis.', lieu: 'Zone coulage béton RDC', mesures_immediates: 'Avertissement verbal. EPI fournis immédiatement.', declare_par: 1 },
    { type_incident: 'presqu_accident', date_incident: '2024-04-22', gravite: 'grave', statut: 'clos', description: 'Fissure détectée sur coffrage poteau avant coulage. Arrêt chantier 4h. Coffrage remplacé. Aucun blessé.', lieu: 'Poteau P14 RDC', mesures_immediates: 'Arrêt immédiat coulage. Remplacement coffrage.', declare_par: 1 },
    { type_incident: 'accident', date_incident: '2024-05-10', gravite: 'mineur', statut: 'clos', description: 'Coupure superficielle lors découpe fer. Soins premiers secours sur place. Reprise immédiate.', lieu: 'Zone ferraillage R+1', mesures_immediates: 'Soins sur place. Pansement posé.', declare_par: 1 },
    { type_incident: 'situation_dangereuse', date_incident: '2024-05-25', gravite: 'moyen', statut: 'declare', description: 'Parpaings stockés sans protection en R+2. Risque chute sur ouvriers en dessous. Mise en sécurité en cours.', lieu: 'Plancher R+2', mesures_immediates: 'Zone balisée. Mise en sécurité en cours.', declare_par: 1 },
  ];

  for (const inc of incidents) {
    await db.query(
      `INSERT INTO IncidentSecurite (type_incident, date_incident, gravite, statut, description, lieu, mesures_immediates, declare_par, id_chantier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [inc.type_incident, inc.date_incident, inc.gravite, inc.statut, inc.description, inc.lieu, inc.mesures_immediates, inc.declare_par, chantierId]
    );
  }
  console.log(`✅ ${incidents.length} incidents HSE créés`);

  // ── 9. Checklists sécurité ───────────────────────────────────────────────
  const checklists = [
    { date: '2024-05-20', type: 'Quotidienne', statut: 'conforme', score: 92 },
    { date: '2024-05-22', type: 'Hebdomadaire', statut: 'non_conforme', score: 74 },
    { date: '2024-05-27', type: 'Quotidienne', statut: 'conforme', score: 88 },
    { date: '2024-05-29', type: 'Quotidienne', statut: 'conforme', score: 95 },
    { date: '2024-05-31', type: 'Mensuelle', statut: 'conforme', score: 89 },
  ];

  for (const c of checklists) {
    await db.query(
      `INSERT INTO ChecklistSecurite (date_checklist, type_checklist, statut, score, id_chantier)
       VALUES (?, ?, ?, ?, ?)`,
      [c.date, c.type, c.statut, c.score, chantierId]
    );
  }
  console.log(`✅ ${checklists.length} checklists créées`);

  // ── 10. Matériel ─────────────────────────────────────────────────────────
  const materiels = [
    { nom: 'Bétonnière 350L', categorie: 'engin', etat: 'bon' },
    { nom: 'Échafaudage tubulaire', categorie: 'echafaudage', etat: 'bon' },
    { nom: 'Grue mobile 10T', categorie: 'engin', etat: 'bon' },
    { nom: 'Vibreur à béton', categorie: 'outil', etat: 'usage' },
    { nom: 'Brouette', categorie: 'outil', etat: 'bon' },
    { nom: 'Meuleuse angle', categorie: 'outil', etat: 'bon' },
  ];

  for (const m of materiels) {
    const [matRes] = await db.query(
      `INSERT INTO Materiel (nom, categorie, etat, id_entreprise)
       VALUES (?, ?, ?, ?)`,
      [m.nom, m.categorie, m.etat, entrepriseId]
    );
    await db.query(
      `INSERT INTO AffectationMateriel (id_materiel, id_chantier, date_sortie)
       VALUES (?, ?, ?)`,
      [matRes.insertId, chantierId, '2024-01-15']
    );
  }
  console.log(`✅ ${materiels.length} matériels créés et affectés`);

  // ── 11. Jalons planning ──────────────────────────────────────────────────
  const jalons = [
    { nom: 'Fondations terminées', date_prevue: '2024-02-10', statut: 'atteint' },
    { nom: 'Gros œuvre RDC terminé', date_prevue: '2024-03-30', statut: 'atteint' },
    { nom: 'Gros œuvre R+1 terminé', date_prevue: '2024-05-10', statut: 'atteint' },
    { nom: 'Gros œuvre R+2 terminé', date_prevue: '2024-06-05', statut: 'en_cours' },
    { nom: 'Toiture posée', date_prevue: '2024-06-30', statut: 'prevu' },
    { nom: 'Second œuvre terminé', date_prevue: '2024-09-15', statut: 'prevu' },
    { nom: 'Réception chantier', date_prevue: '2024-10-30', statut: 'prevu' },
  ];

  for (const j of jalons) {
    await db.query(
      `INSERT INTO Jalon (nom, date_prevue, statut, id_chantier)
       VALUES (?, ?, ?, ?)`,
      [j.nom, j.date_prevue, j.statut, chantierId]
    );
  }
  console.log(`✅ ${jalons.length} jalons créés`);

  console.log('\n🎉 Données démo insérées avec succès !');
  console.log(`📋 Chantier ID: ${chantierId}`);
  console.log(`🏢 Entreprise ID: ${entrepriseId}`);
  console.log('\nAjoute dans .env.local :');
  console.log(`DEMO_CHANTIER_ID=${chantierId}`);
  console.log(`DEMO_ENTREPRISE_ID=${entrepriseId}`);

} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error(error);
} finally {
  await db.end();
}