import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est admin depuis la session
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const db = await connectDB();

    // Statistiques utilisateurs
    const [usersCount] = await db.execute(
      'SELECT COUNT(*) as total FROM Utilisateur'
    );

    const [newUsersCount] = await db.execute(
      'SELECT COUNT(*) as new FROM Utilisateur WHERE DATE(date_creation) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );

    const [previousMonthUsers] = await db.execute(
      'SELECT COUNT(*) as previous FROM Utilisateur WHERE DATE(date_creation) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE(date_creation) < DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );

    // Calcul du taux de croissance
    const growth = previousMonthUsers[0].previous > 0 
      ? Math.round(((newUsersCount[0].new - previousMonthUsers[0].previous) / previousMonthUsers[0].previous) * 100)
      : newUsersCount[0].new > 0 ? 100 : 0;

    // Statistiques rapports
    const [reportsTotal] = await db.execute(
      'SELECT COUNT(*) as total FROM Rapport'
    );

    const [reportsPending] = await db.execute(
      'SELECT COUNT(*) as pending FROM Rapport WHERE statut = "en_attente" OR statut IS NULL'
    );

    const [reportsValidated] = await db.execute(
      'SELECT COUNT(*) as validated FROM Rapport WHERE statut = "valide"'
    );

    const [reportsRejected] = await db.execute(
      'SELECT COUNT(*) as rejected FROM Rapport WHERE statut = "rejete"'
    );

    // Activité récente (derniers rapports créés/modifiés)
    const [recentActivity] = await db.execute(`
      SELECT 
        r.id_rapport,
        r.nom_chantier,
        r.statut,
        r.date_creation,
        u.nom,
        u.prenom
      FROM Rapport r
      JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
      ORDER BY r.date_creation DESC
      LIMIT 10
    `);

    const stats = {
      users: {
        total: usersCount[0].total || 0,
        new: newUsersCount[0].new || 0,
        growth: growth
      },
      reports: {
        total: reportsTotal[0].total || 0,
        pending: reportsPending[0].pending || 0,
        validated: reportsValidated[0].validated || 0,
        rejected: reportsRejected[0].rejected || 0
      },
      activity: recentActivity || []
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Erreur API dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
