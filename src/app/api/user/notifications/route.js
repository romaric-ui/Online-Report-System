// API pour gérer les notifications utilisateur
import { getServerSession } from 'next-auth';
import { connectDB } from '../../../../../lib/database.js';

// GET - Récupérer les notifications de l'utilisateur connecté
export async function GET(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return Response.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const nonLues = searchParams.get('nonLues') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const db = await connectDB();
    
    let query = `
      SELECT 
        id_notification,
        type_notification,
        titre,
        contenu,
        lien,
        lu,
        date_creation,
        date_lecture
      FROM notification
      WHERE id_utilisateur = ?
    `;
    
    if (nonLues) {
      query += ' AND lu = FALSE';
    }
    
    query += ' ORDER BY date_creation DESC LIMIT ?';
    
    const [notifications] = await db.execute(query, [session.user.id, limit]);
    
    // Compter les notifications non lues
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as count FROM notification WHERE id_utilisateur = ? AND lu = FALSE',
      [session.user.id]
    );
    
    return Response.json({
      success: true,
      notifications,
      nonLuesCount: countResult[0].count
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Marquer une notification comme lue
export async function PUT(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return Response.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }
    
    const { id_notification, marquerToutesLues } = await request.json();
    const db = await connectDB();
    
    if (marquerToutesLues) {
      // Marquer toutes les notifications comme lues
      await db.execute(
        'UPDATE notification SET lu = TRUE, date_lecture = NOW() WHERE id_utilisateur = ? AND lu = FALSE',
        [session.user.id]
      );
      
      return Response.json({
        success: true,
        message: 'Toutes les notifications marquées comme lues'
      });
    } else if (id_notification) {
      // Marquer une notification spécifique comme lue
      await db.execute(
        'UPDATE notification SET lu = TRUE, date_lecture = NOW() WHERE id_notification = ? AND id_utilisateur = ?',
        [id_notification, session.user.id]
      );
      
      return Response.json({
        success: true,
        message: 'Notification marquée comme lue'
      });
    } else {
      return Response.json({
        success: false,
        error: 'ID de notification requis'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Erreur mise à jour notification:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Supprimer une notification
export async function DELETE(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return Response.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const toutesLues = searchParams.get('toutesLues') === 'true';
    
    const db = await connectDB();
    
    if (toutesLues) {
      // Supprimer toutes les notifications lues
      await db.execute(
        'DELETE FROM notification WHERE id_utilisateur = ? AND lu = TRUE',
        [session.user.id]
      );
      
      return Response.json({
        success: true,
        message: 'Notifications lues supprimées'
      });
    } else if (id) {
      // Supprimer une notification spécifique
      await db.execute(
        'DELETE FROM notification WHERE id_notification = ? AND id_utilisateur = ?',
        [id, session.user.id]
      );
      
      return Response.json({
        success: true,
        message: 'Notification supprimée'
      });
    } else {
      return Response.json({
        success: false,
        error: 'ID requis'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
