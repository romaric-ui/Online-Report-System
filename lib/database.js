// lib/database.js - Configuration base de données intelligente (local/Aiven)
import mysql from 'mysql2/promise';

// Détection automatique de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Configuration automatique selon l'environnement
const dbConfig = isProduction ? {
  // Configuration PRODUCTION - Aiven (variables d'environnement OBLIGATOIRES)
  host: process.env.AIVEN_HOST,
  user: process.env.AIVEN_USER,
  password: process.env.AIVEN_PASSWORD,
  database: process.env.AIVEN_DATABASE,
  port: parseInt(process.env.AIVEN_PORT),
  ssl: { 
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectTimeout: 30000,
  acquireTimeout: 30000,
  timeout: 30000,
} : {
  // Configuration DÉVELOPPEMENT - Local MySQL
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'onlinereports',
  port: 3306,
  ssl: false,
  connectTimeout: 60000,
};

// Pool de connexions pour de meilleures performances
let connectionPool;

// Configuration optimisée du pool (sans options non supportées)
const poolConfig = {
  ...dbConfig,
  connectionLimit: 10,        // Maximum 10 connexions simultanées
  idleTimeout: 300000,        // 5 minutes avant fermeture connexion inactive
  queueLimit: 0,              // Pas de limite sur la queue
};

// Validation des variables d'environnement obligatoires
function validateEnvironmentVariables() {
  if (isProduction) {
    const requiredVars = ['AIVEN_HOST', 'AIVEN_USER', 'AIVEN_PASSWORD', 'AIVEN_DATABASE', 'AIVEN_PORT'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}\n` +
        `📝 Configurez ces variables dans Netlify > Site settings > Environment variables`);
    }
  }
}

export async function connectDB() {
  try {
    // Valider les variables d'environnement
    validateEnvironmentVariables();
    
    if (!connectionPool) {
      connectionPool = mysql.createPool(poolConfig);
      const env = isProduction ? '🌐 PRODUCTION (Aiven)' : '💻 DÉVELOPPEMENT (Local)';
      console.log(`⚡ Pool de connexions créé - ${env}`);
      console.log(`📍 Serveur: ${dbConfig.host}:${dbConfig.port} | DB: ${dbConfig.database}`);
    }
    return connectionPool;
  } catch (error) {
    const env = isProduction ? 'Aiven (production)' : 'Local (développement)';
    console.error(`❌ Erreur connexion BD ${env}:`, error);
    throw error;
  }
}

export async function closeDB() {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
    console.log('🔌 Pool de connexions fermé');
  }
}

// Cache pour éviter de répéter la détection de structure
let databaseStructureCache = null;

// Détection automatique de la structure de base de données
async function detectDatabaseStructure(db) {
  if (databaseStructureCache) {
    return databaseStructureCache;
  }

  try {
    // Vérifier la structure de la table utilisateur
    const [userColumns] = await db.execute('DESCRIBE utilisateur');
    const userIdColumn = userColumns.find(col => 
      col.Field === 'id_utilisateur' || col.Field === 'id' || col.Field === 'user_id'
    );

    databaseStructureCache = {
      userIdColumn: userIdColumn ? userIdColumn.Field : 'id_utilisateur',
      hasUserTable: userColumns.length > 0
    };

    console.log(`🔍 Structure détectée: colonne utilisateur = ${databaseStructureCache.userIdColumn}`);
    return databaseStructureCache;
  } catch (error) {
    console.warn('⚠️  Impossible de détecter la structure, utilisation des valeurs par défaut');
    databaseStructureCache = {
      userIdColumn: 'id',
      hasUserTable: false
    };
    return databaseStructureCache;
  }
}

// Cache simple pour les rapports (5 minutes)
let reportsCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// Fonctions CRUD optimisées avec cache et pool
export async function getAllReports() {
  // Vérifier le cache d'abord
  if (reportsCache.data && reportsCache.timestamp && 
      (Date.now() - reportsCache.timestamp < reportsCache.ttl)) {
    console.log('📦 Données récupérées depuis le cache (rapide)');
    return reportsCache.data;
  }

  const db = await connectDB();
  
  try {
    // Détecter automatiquement la structure
    const structure = await detectDatabaseStructure(db);
    
    let query;
    if (structure.hasUserTable) {
      // Essayer avec JOIN si la table utilisateur existe
      query = `
        SELECT r.id_rapport, r.titre, r.description, r.fichier_pdf, 
               r.date_creation, r.date_modification, r.id_utilisateur,
               r.image_couverture, r.image_couverture_type,
               u.nom, u.prenom, u.email
        FROM rapport r
        LEFT JOIN utilisateur u ON r.id_utilisateur = u.${structure.userIdColumn}
        ORDER BY r.date_creation DESC
      `;
    } else {
      // Version sans JOIN si pas de table utilisateur
      query = `
        SELECT id_rapport, titre, description, fichier_pdf, 
               date_creation, date_modification, id_utilisateur,
               image_couverture, image_couverture_type
        FROM rapport
        ORDER BY date_creation DESC
      `;
    }
    
    const [rapports] = await db.execute(query);

    // Pour chaque rapport, récupérer ses données de formulaire
    const rapportsComplets = [];
    for (const rapport of rapports) {
      try {
        const [donnees] = await db.execute(`
          SELECT champ_nom, champ_valeur 
          FROM donneesformulaire 
          WHERE id_rapport = ?
        `, [rapport.id_rapport]);

        // Reconstituer l'objet rapport au format de l'app
        const reportData = {
          id: `rpt_${rapport.id_rapport}`,
          createdAt: rapport.date_creation,
          updatedAt: rapport.date_modification || rapport.date_creation,
          titre: rapport.titre,
          description: rapport.description,
          fichier_pdf: rapport.fichier_pdf,
          image_couverture: rapport.image_couverture,
          image_couverture_type: rapport.image_couverture_type,
          id_utilisateur: rapport.id_utilisateur,
          utilisateur: rapport.nom ? `${rapport.prenom} ${rapport.nom}` : null,
        };

        // Ajouter les champs du formulaire
        donnees.forEach(({ champ_nom, champ_valeur }) => {
          if (champ_nom === 'investigationPoints' || champ_nom === 'autresPoints') {
            try {
              reportData[champ_nom] = JSON.parse(champ_valeur || '[]');
            } catch {
              reportData[champ_nom] = [];
            }
          } else {
            reportData[champ_nom] = champ_valeur;
          }
        });

        rapportsComplets.push(reportData);
      } catch (error) {
        console.warn(`⚠️  Erreur lors du traitement du rapport ${rapport.id_rapport}:`, error.message);
        // Ajouter le rapport sans ses données de formulaire
        rapportsComplets.push({
          id: `rpt_${rapport.id_rapport}`,
          createdAt: rapport.date_creation,
          updatedAt: rapport.date_modification || rapport.date_creation,
          titre: rapport.titre,
          description: rapport.description,
          fichier_pdf: rapport.fichier_pdf,
          image_couverture: rapport.image_couverture,
          image_couverture_type: rapport.image_couverture_type,
          id_utilisateur: rapport.id_utilisateur,
          utilisateur: rapport.nom ? `${rapport.prenom} ${rapport.nom}` : null,
        });
      }
    }
    
    // Mettre en cache les résultats
    reportsCache.data = rapportsComplets;
    reportsCache.timestamp = Date.now();
    console.log(`💾 ${rapportsComplets.length} rapports mis en cache`);
    
    return rapportsComplets;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des rapports:', error.message);
    
    // Fallback: essayer une requête ultra-simple
    try {
      console.log('🔄 Tentative avec requête de secours...');
      const [rapports] = await db.execute('SELECT * FROM rapport ORDER BY date_creation DESC LIMIT 10');
      return rapports.map(rapport => ({
        id: `rpt_${rapport.id_rapport || rapport.id}`,
        createdAt: rapport.date_creation,
        titre: rapport.titre || 'Rapport sans titre',
        description: rapport.description || '',
      }));
    } catch (fallbackError) {
      console.error('❌ Erreur critique:', fallbackError.message);
      return []; // Retourner un tableau vide plutôt qu'une erreur
    }
  }
}

export async function createReport(reportData) {
  const db = await connectDB();
  
  try {
    await db.beginTransaction();

    // 1. Insérer dans la table Rapport
    const titre = `Rapport ${reportData.proprietaire || 'Sans nom'} - Phase ${reportData.phase || '?'}`;
    
    // Mapper les données d'image du formulaire vers la base de données
    const imageCouverture = reportData.coverImage || reportData.imageCouverture || null;
    const imageCouvertureType = reportData.coverImageType || reportData.imageCouvertureType || null;
    
    const [rapportResult] = await db.execute(`
      INSERT INTO Rapport (titre, description, fichier_pdf, image_couverture, image_couverture_type, id_utilisateur) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      titre,
      reportData.description || 'Rapport généré automatiquement',
      reportData.pdfDataUrl || '',
      imageCouverture, // Image de couverture (base64 ou chemin)
      imageCouvertureType, // Type MIME de l'image
      1 // ID utilisateur par défaut, à adapter selon ton système d'auth
    ]);

    const idRapport = rapportResult.insertId;

    // 2. Insérer les données de formulaire
    const champsIgnores = ['id', 'createdAt', 'updatedAt', 'titre', 'description', 'fichier_pdf', 'utilisateur'];
    
    for (const [champ, valeur] of Object.entries(reportData)) {
      if (champsIgnores.includes(champ) || valeur === undefined || valeur === null) continue;
      
      let valeurStr = valeur;
      if (typeof valeur === 'object') {
        valeurStr = JSON.stringify(valeur);
      } else if (typeof valeur !== 'string') {
        valeurStr = String(valeur);
      }

      await db.execute(`
        INSERT INTO DonneesFormulaire (champ_nom, champ_valeur, id_rapport) 
        VALUES (?, ?, ?)
      `, [champ, valeurStr, idRapport]);
    }

    await db.commit();
    return { insertId: idRapport };
    
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

export async function updateReport(id, reportData) {
  const db = await connectDB();
  const idRapport = parseInt(id.replace('rpt_', ''));
  
  try {
    await db.beginTransaction();

    // 1. Mettre à jour la table Rapport
    const titre = `Rapport ${reportData.proprietaire || 'Sans nom'} - Phase ${reportData.phase || '?'}`;
    await db.execute(`
      UPDATE Rapport SET titre=?, description=?, fichier_pdf=?, date_modification=CURRENT_TIMESTAMP 
      WHERE id_rapport=?
    `, [
      titre,
      reportData.description || 'Rapport modifié',
      reportData.pdfDataUrl || '',
      idRapport
    ]);

    // 2. Supprimer les anciennes données de formulaire
    await db.execute('DELETE FROM DonneesFormulaire WHERE id_rapport = ?', [idRapport]);

    // 3. Insérer les nouvelles données de formulaire
    const champsIgnores = ['id', 'createdAt', 'updatedAt', 'titre', 'description', 'fichier_pdf', 'utilisateur'];
    
    for (const [champ, valeur] of Object.entries(reportData)) {
      if (champsIgnores.includes(champ) || valeur === undefined || valeur === null) continue;
      
      let valeurStr = valeur;
      if (typeof valeur === 'object') {
        valeurStr = JSON.stringify(valeur);
      } else if (typeof valeur !== 'string') {
        valeurStr = String(valeur);
      }

      await db.execute(`
        INSERT INTO DonneesFormulaire (champ_nom, champ_valeur, id_rapport) 
        VALUES (?, ?, ?)
      `, [champ, valeurStr, idRapport]);
    }

    await db.commit();
    return { affectedRows: 1 };
    
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

export async function deleteReport(id) {
  const db = await connectDB();
  const idRapport = parseInt(id.replace('rpt_', ''));
  
  try {
    await db.beginTransaction();

    // Supprimer les données de formulaire en premier (contrainte FK)
    await db.execute('DELETE FROM DonneesFormulaire WHERE id_rapport = ?', [idRapport]);
    
    // Supprimer l'historique des téléchargements
    await db.execute('DELETE FROM HistoriqueTelechargement WHERE id_rapport = ?', [idRapport]);
    
    // Supprimer le rapport
    const [result] = await db.execute('DELETE FROM Rapport WHERE id_rapport = ?', [idRapport]);

    await db.commit();
    return result;
    
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

// Fonction utilitaire pour enregistrer un téléchargement
export async function logDownload(idUtilisateur, idRapport) {
  const db = await connectDB();
  await db.execute(`
    INSERT INTO HistoriqueTelechargement (id_utilisateur, id_rapport) 
    VALUES (?, ?)
  `, [idUtilisateur, parseInt(idRapport.replace('rpt_', ''))]);
}

// Fonctions pour gérer les images de couverture
export async function saveImageCouverture(idRapport, imageData) {
  const db = await connectDB();
  
  const [result] = await db.execute(`
    INSERT INTO ImageCouverture (
      id_rapport, nom_fichier, nom_stockage, chemin_fichier, 
      type_mime, taille_fichier, largeur, hauteur, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    parseInt(idRapport.replace('rpt_', '')),
    imageData.nomFichier,
    imageData.nomStockage,
    imageData.cheminFichier,
    imageData.typeMime,
    imageData.tailleFichier,
    imageData.largeur || null,
    imageData.hauteur || null,
    imageData.description || null
  ]);
  
  return result;
}

export async function getImageCouverture(idRapport) {
  const db = await connectDB();
  
  const [images] = await db.execute(`
    SELECT * FROM ImageCouverture 
    WHERE id_rapport = ? 
    ORDER BY date_upload DESC 
    LIMIT 1
  `, [parseInt(idRapport.replace('rpt_', ''))]);
  
  return images[0] || null;
}

export async function updateImageCouverture(idRapport, imageData) {
  const db = await connectDB();
  
  try {
    await db.beginTransaction();
    
    // Supprimer l'ancienne image s'il y en a une
    await db.execute(`
      DELETE FROM ImageCouverture WHERE id_rapport = ?
    `, [parseInt(idRapport.replace('rpt_', ''))]);
    
    // Ajouter la nouvelle image
    await saveImageCouverture(idRapport, imageData);
    
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

export async function deleteImageCouverture(idRapport) {
  const db = await connectDB();
  
  const [result] = await db.execute(`
    DELETE FROM ImageCouverture WHERE id_rapport = ?
  `, [parseInt(idRapport.replace('rpt_', ''))]);
  
  return result;
}