import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../../../lib/database';
import { validateEmail, validatePassword, validateName } from '../../../../../lib/security';
import bcrypt from 'bcryptjs';

// Helper : vérifier que l'appelant est admin
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return { authorized: false };
  }
  return { authorized: true, session };
}

// GET - Lister tous les comptes admin
export async function GET() {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const db = await connectDB();
    const [admins] = await db.execute(`
      SELECT id_utilisateur as id, nom, prenom, email, provider, date_creation, derniere_connexion, statut
      FROM Utilisateur 
      WHERE id_role = 1
      ORDER BY date_creation DESC
    `);

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Erreur GET admins:', error.message);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un nouveau compte admin
export async function POST(request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { nom, prenom, email, password, role } = body;

    // Validations
    if (!nom || !prenom || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires (nom, prénom, email, mot de passe)' },
        { status: 400 }
      );
    }

    // Rôle : 'admin' (id_role=1) ou 'user' (id_role=2) — défaut admin
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }
    const idRole = role === 'user' ? 2 : 1;

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    const nomValidation = validateName(nom, 'Nom');
    if (!nomValidation.isValid) {
      return NextResponse.json({ error: nomValidation.error }, { status: 400 });
    }

    const prenomValidation = validateName(prenom, 'Prénom');
    if (!prenomValidation.isValid) {
      return NextResponse.json({ error: prenomValidation.error }, { status: 400 });
    }

    const db = await connectDB();

    // Vérifier unicité email
    const [existing] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ? LIMIT 1',
      [emailValidation.value]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(passwordValidation.value, 12);

    // Créer le compte avec le rôle choisi
    const [result] = await db.execute(
      `INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role, provider, email_verified, statut)
       VALUES (?, ?, ?, ?, ?, 'credentials', 1, 'actif')`,
      [nomValidation.value, prenomValidation.value, emailValidation.value, hashedPassword, idRole]
    );

    const isAdmin = idRole === 1;
    return NextResponse.json({
      success: true,
      message: isAdmin ? 'Compte administrateur créé avec succès' : 'Compte utilisateur créé avec succès',
      admin: {
        id: result.insertId,
        nom: nomValidation.value,
        prenom: prenomValidation.value,
        email: emailValidation.value,
        role: isAdmin ? 'admin' : 'user'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST create-admin:', error.message);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
