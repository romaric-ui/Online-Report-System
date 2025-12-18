import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../../../lib/database.js';

// GET - Récupérer les rapports de l'utilisateur connecté
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const db = await connectDB();

    const [reports] = await db.execute(
      `SELECT 
        r.*,
        u.nom as createur_nom,
        u.prenom as createur_prenom
      FROM rapport r
      JOIN utilisateur u ON r.id_utilisateur = u.id_utilisateur
      WHERE r.id_utilisateur = ?
      ORDER BY r.date_creation DESC`,
      [session.user.id]
    );

    console.log(`📄 ${reports.length} rapports récupérés pour l'utilisateur ${session.user.id}`);

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('❌ Erreur GET rapports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rapports' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau rapport
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      numero_affaire,
      numero_rapport,
      nom_chantier,
      adresse_chantier,
      date_visite,
      phase,
      equipe_presente,
      materiel_utilise,
      objectifs_limites,
      deroulement,
      investigation,
      autres_points,
      conclusion,
      photo_couverture
    } = body;

    // Validation des champs requis
    if (!numero_affaire || !numero_rapport || !nom_chantier) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    const [result] = await db.execute(
      `INSERT INTO rapport (
        id_utilisateur,
        numero_affaire,
        numero_rapport,
        nom_chantier,
        adresse_chantier,
        date_visite,
        phase,
        equipe_presente,
        materiel_utilise,
        objectifs_limites,
        deroulement,
        investigation,
        autres_points,
        conclusion,
        photo_couverture,
        statut,
        date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', NOW())`,
      [
        session.user.id,
        numero_affaire,
        numero_rapport,
        nom_chantier,
        adresse_chantier || null,
        date_visite || new Date().toISOString().split('T')[0],
        phase || 'Réservé',
        equipe_presente ? JSON.stringify(equipe_presente) : null,
        materiel_utilise ? JSON.stringify(materiel_utilise) : null,
        objectifs_limites || null,
        deroulement || null,
        investigation ? JSON.stringify(investigation) : null,
        autres_points ? JSON.stringify(autres_points) : null,
        conclusion || null,
        photo_couverture || null
      ]
    );

    console.log(`✅ Rapport créé avec ID: ${result.insertId}`);

    return NextResponse.json(
      { 
        message: 'Rapport créé avec succès',
        id_rapport: result.insertId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Erreur POST rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du rapport' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un rapport
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id_rapport, ...updateData } = body;

    if (!id_rapport) {
      return NextResponse.json(
        { error: 'ID rapport manquant' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Vérifier que le rapport appartient à l'utilisateur
    const [rapport] = await db.execute(
      'SELECT id_utilisateur FROM rapport WHERE id_rapport = ?',
      [id_rapport]
    );

    if (rapport.length === 0) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      );
    }

    if (rapport[0].id_utilisateur !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier ce rapport' },
        { status: 403 }
      );
    }

    // Construire la requête UPDATE dynamiquement
    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
    
    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => 
      typeof updateData[field] === 'object' ? JSON.stringify(updateData[field]) : updateData[field]
    );

    await db.execute(
      `UPDATE rapport SET ${setClause}, date_modification = NOW() WHERE id_rapport = ?`,
      [...values, id_rapport]
    );

    console.log(`✅ Rapport ${id_rapport} modifié`);

    return NextResponse.json({ message: 'Rapport modifié avec succès' });

  } catch (error) {
    console.error('❌ Erreur PUT rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du rapport' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rapport
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id_rapport = searchParams.get('id');

    if (!id_rapport) {
      return NextResponse.json(
        { error: 'ID rapport manquant' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Vérifier que le rapport appartient à l'utilisateur
    const [rapport] = await db.execute(
      'SELECT id_utilisateur FROM rapport WHERE id_rapport = ?',
      [id_rapport]
    );

    if (rapport.length === 0) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      );
    }

    if (rapport[0].id_utilisateur !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce rapport' },
        { status: 403 }
      );
    }

    await db.execute(
      'DELETE FROM rapport WHERE id_rapport = ?',
      [id_rapport]
    );

    console.log(`🗑️ Rapport ${id_rapport} supprimé`);

    return NextResponse.json({ message: 'Rapport supprimé avec succès' });

  } catch (error) {
    console.error('❌ Erreur DELETE rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du rapport' },
      { status: 500 }
    );
  }
}
