import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../lib/database';
import { validateEmail, validateName, validateId } from '../../../../../lib/security';

// Helper : vérifier que l'appelant est admin
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return { authorized: false, session: null };
  }
  return { authorized: true, session };
}

// GET - Récupérer tous les utilisateurs
export async function GET() {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const db = await connectDB();

    // Récupérer tous les utilisateurs avec leur rôle via la table Role
    const [users] = await db.execute(`
      SELECT 
        u.id_utilisateur as id, 
        u.nom, 
        u.prenom, 
        u.email,
        u.telephone,
        u.statut,
        u.provider_id as google_id,
        u.provider,
        u.date_creation,
        u.derniere_connexion,
        r.nom_role as role
      FROM Utilisateur u
      LEFT JOIN Role r ON u.id_role = r.id_role
      ORDER BY u.date_creation DESC
    `);

    // Normaliser le rôle pour le frontend
    const normalizedUsers = users.map(u => ({
      ...u,
      role: u.role === 'Administrateur' ? 'admin' : 'user',
      status: u.statut === 'bloque' ? 'blocked' : 'active'
    }));

    return NextResponse.json(normalizedUsers);

  } catch (error) {
    console.error('Erreur API admin/users GET:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des utilisateurs' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un utilisateur (nom, prénom, email)
export async function PUT(request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nom, prenom, email } = body;

    // Validation de l'ID
    const idValidation = validateId(id, 'ID utilisateur');
    if (!idValidation.isValid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    // Construire la requête de mise à jour avec validation
    const updates = [];
    const values = [];

    if (nom !== undefined) {
      const nomValidation = validateName(nom, 'Nom');
      if (!nomValidation.isValid) {
        return NextResponse.json({ error: nomValidation.error }, { status: 400 });
      }
      updates.push('nom = ?');
      values.push(nomValidation.value);
    }

    if (prenom !== undefined) {
      const prenomValidation = validateName(prenom, 'Prénom');
      if (!prenomValidation.isValid) {
        return NextResponse.json({ error: prenomValidation.error }, { status: 400 });
      }
      updates.push('prenom = ?');
      values.push(prenomValidation.value);
    }

    if (email !== undefined) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 });
      }
      updates.push('email = ?');
      values.push(emailValidation.value);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à modifier' }, { status: 400 });
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

    // Si changement d'email, vérifier l'unicité
    if (email !== undefined) {
      const [duplicate] = await db.execute(
        'SELECT id_utilisateur FROM Utilisateur WHERE email = ? AND id_utilisateur != ?',
        [email.trim().toLowerCase(), idValidation.value]
      );
      if (duplicate.length > 0) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
      }
    }

    values.push(idValidation.value);

    await db.execute(
      `UPDATE Utilisateur SET ${updates.join(', ')} WHERE id_utilisateur = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Utilisateur modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur API admin/users PUT:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'utilisateur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request) {
  try {
    const { authorized, session } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');

    const idValidation = validateId(rawId, 'ID utilisateur');
    if (!idValidation.isValid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }

    // Empêcher l'auto-suppression
    if (parseInt(session.user.id) === idValidation.value) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Vérifier si l'utilisateur existe
    const [users] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE id_utilisateur = ?',
      [idValidation.value]
    );

    if (users.length === 0) {
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
    console.error('Erreur API admin/users DELETE:', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}