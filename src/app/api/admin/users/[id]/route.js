import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../../lib/database';

// PUT - Mettre à jour un utilisateur (bloquer, débloquer, promouvoir, rétrograder)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = params;
    const { action, status, role } = await request.json();

    const db = await connectDB();
    let query, values;

    switch (action) {
      case 'block':
        query = 'UPDATE utilisateur SET status = ? WHERE id = ?';
        values = ['blocked', id];
        break;
      
      case 'unblock':
        query = 'UPDATE utilisateur SET status = ? WHERE id = ?';
        values = ['active', id];
        break;
      
      case 'promote':
        query = 'UPDATE utilisateur SET role = ? WHERE id = ?';
        values = ['admin', id];
        break;
      
      case 'demote':
        query = 'UPDATE utilisateur SET role = ? WHERE id = ?';
        values = ['user', id];
        break;
      
      default:
      return Response.json({ error: 'Action invalide' }, { status: 400 });
    }

    await db.execute(query, values);

    return Response.json({ 
      success: true,
      message: `Utilisateur ${action === 'block' ? 'bloqué' : action === 'unblock' ? 'débloqué' : action === 'promote' ? 'promu admin' : 'rétrogradé'} avec succès` 
    });

  } catch (error) {
    console.error('Erreur lors de la modification:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = params;

    // Ne pas permettre de supprimer son propre compte
    if (session.user.id === parseInt(id)) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    const db = await connectDB();

    // Supprimer d'abord les rapports de l'utilisateur
    await db.execute('DELETE FROM rapport WHERE id_utilisateur = ?', [id]);
    
    // Puis supprimer l'utilisateur
    await db.execute('DELETE FROM utilisateur WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
