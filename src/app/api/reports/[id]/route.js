import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../lib/database.js';

// Liste blanche des colonnes modifiables (protection SQL injection)
const ALLOWED_COLUMNS = new Set([
  'numero_affaire', 'numero_rapport', 'nom_chantier', 'adresse_chantier',
  'date_visite', 'phase', 'equipe_presente', 'materiel_utilise',
  'objectifs_limites', 'deroulement', 'investigation', 'autres_points',
  'conclusion', 'photo_couverture', 'statut', 'titre', 'description'
]);

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id);

    if (!reportId || isNaN(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier propriété du rapport
    const [rapport] = await db.execute(
      'SELECT id_utilisateur FROM rapport WHERE id_rapport = ?',
      [reportId]
    );

    if (rapport.length === 0) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
    }

    if (rapport[0].id_utilisateur !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { id_rapport, id_utilisateur, date_creation, ...updateData } = body;

    // Filtrer uniquement les colonnes autorisées (anti SQL injection)
    const safeFields = Object.keys(updateData).filter(key => ALLOWED_COLUMNS.has(key));

    if (safeFields.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide à mettre à jour' }, { status: 400 });
    }

    const setClause = safeFields.map(field => `${field} = ?`).join(', ');
    const values = safeFields.map(field =>
      typeof updateData[field] === 'object' ? JSON.stringify(updateData[field]) : updateData[field]
    );

    await db.execute(
      `UPDATE rapport SET ${setClause}, date_modification = NOW() WHERE id_rapport = ?`,
      [...values, reportId]
    );

    return NextResponse.json({ success: true, message: 'Rapport modifié avec succès' });

  } catch (error) {
    console.error('Erreur PUT rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du rapport' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id);

    if (!reportId || isNaN(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier propriété du rapport
    const [rapport] = await db.execute(
      'SELECT id_utilisateur FROM rapport WHERE id_rapport = ?',
      [reportId]
    );

    if (rapport.length === 0) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 });
    }

    if (rapport[0].id_utilisateur !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await db.execute('DELETE FROM rapport WHERE id_rapport = ?', [reportId]);

    return NextResponse.json({ success: true, message: 'Rapport supprimé avec succès' });

  } catch (error) {
    console.error('Erreur DELETE rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du rapport' },
      { status: 500 }
    );
  }
}