import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../../lib/database';
import { validateId } from '../../../../../../lib/security';

// Helper : vérifier que l'appelant est admin
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return { authorized: false, session: null };
  }
  return { authorized: true, session };
}

// PUT - Mettre à jour un utilisateur (bloquer, débloquer, promouvoir, rétrograder)
export async function PUT(request, { params }) {
  try {
    const { authorized, session } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const idValidation = validateId(id, 'ID utilisateur');
    if (!idValidation.isValid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['block', 'unblock'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier que l'utilisateur existe
    const [existing] = await db.execute(
      'SELECT id_utilisateur, id_role FROM Utilisateur WHERE id_utilisateur = ?',
      [idValidation.value]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Empêcher un admin de se modifier lui-même
    if (parseInt(session.user.id) === idValidation.value) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre compte' },
        { status: 400 }
      );
    }

    let query, values, message;

    switch (action) {
      case 'block':
        query = 'UPDATE Utilisateur SET statut = ? WHERE id_utilisateur = ?';
        values = ['bloque', idValidation.value];
        message = 'Utilisateur bloqué avec succès';
        break;

      case 'unblock':
        query = 'UPDATE Utilisateur SET statut = ? WHERE id_utilisateur = ?';
        values = ['actif', idValidation.value];
        message = 'Utilisateur débloqué avec succès';
        break;

    }

    await db.execute(query, values);

    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('Erreur API admin/users/[id] PUT');
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request, { params }) {
  try {
    const { authorized, session } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const idValidation = validateId(id, 'ID utilisateur');
    if (!idValidation.isValid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    // Ne pas permettre de supprimer son propre compte
    if (parseInt(session.user.id) === idValidation.value) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Vérifier que l'utilisateur existe
    const [existing] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE id_utilisateur = ?',
      [idValidation.value]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Supprimer les données liées puis l'utilisateur
    await db.execute('DELETE FROM Rapport WHERE id_utilisateur = ?', [idValidation.value]);
    await db.execute('DELETE FROM Utilisateur WHERE id_utilisateur = ?', [idValidation.value]);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur API admin/users/[id] DELETE');
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
