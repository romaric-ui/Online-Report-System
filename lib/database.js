// lib/database.js - Configuration base de données (utilise ta BD existante)
import mysql from 'mysql2/promise';

// Configuration de connexion à ta BD existante
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'onlinereports',
  port: process.env.DB_PORT || 3306,
};

let connection;

export async function connectDB() {
  try {
    if (!connection || connection.connection._closing) {
      connection = await mysql.createConnection(dbConfig);
      console.log('✅ Base de données connectée');
    }
    return connection;
  } catch (error) {
    console.error('❌ Erreur connexion BD:', error);
    throw error;
  }
}

export async function closeDB() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

// Fonctions CRUD adaptées à ta structure BD existante
export async function getAllReports() {
  const db = await connectDB();
  
  // Récupérer les rapports avec leurs données de formulaire
  const [rapports] = await db.execute(`
    SELECT r.id_rapport, r.titre, r.description, r.fichier_pdf, 
           r.date_creation, r.date_modification, r.id_utilisateur,
           u.nom, u.prenom, u.email
    FROM Rapport r
    LEFT JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
    ORDER BY r.date_creation DESC
  `);

  // Pour chaque rapport, récupérer ses données de formulaire
  const rapportsComplets = [];
  for (const rapport of rapports) {
    const [donnees] = await db.execute(`
      SELECT champ_nom, champ_valeur 
      FROM DonneesFormulaire 
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
  }
  
  return rapportsComplets;
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