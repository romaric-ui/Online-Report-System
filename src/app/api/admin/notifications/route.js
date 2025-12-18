import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../lib/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const db = await connectDB();
    const notifications = [];

    // Nouveaux utilisateurs (dernières 24h)
    const [newUsers] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM utilisateur 
      WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    if (newUsers[0].count > 0) {
      notifications.push({
        type: 'user',
        title: 'Nouveaux utilisateurs',
        message: `${newUsers[0].count} nouveau(x) utilisateur(s) inscrit(s) aujourd'hui`,
        time: 'Aujourd\'hui'
      });
    }

    // Nouveaux rapports (dernières 24h)
    const [newReports] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM rapport 
      WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    if (newReports[0].count > 0) {
      notifications.push({
        type: 'report',
        title: 'Nouveaux rapports',
        message: `${newReports[0].count} nouveau(x) rapport(s) créé(s) aujourd'hui`,
        time: 'Aujourd\'hui'
      });
    }

    // Utilisateurs récemment connectés (dernière heure)
    const [recentLogins] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM utilisateur 
      WHERE derniere_connexion >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    if (recentLogins[0].count > 0) {
      notifications.push({
        type: 'user',
        title: 'Activité récente',
        message: `${recentLogins[0].count} utilisateur(s) connecté(s) récemment`,
        time: 'Il y a 1h'
      });
    }

    return NextResponse.json(notifications);

  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
