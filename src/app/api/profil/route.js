import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { connectDB } from '../../../../lib/database.js';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const db = await connectDB();
    const userId = parseInt(session.user.id, 10);

    const [rows] = await db.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.photo_url,
              u.id_entreprise, u.id_role_entreprise,
              e.nom AS entreprise_nom, e.adresse AS entreprise_adresse,
              e.pays AS entreprise_pays, e.telephone AS entreprise_telephone,
              e.email_contact AS entreprise_email_contact, e.logo_url AS entreprise_logo_url
       FROM Utilisateur u
       LEFT JOIN Entreprise e ON u.id_entreprise = e.id_entreprise
       WHERE u.id_utilisateur = ?`,
      [userId]
    );

    if (!rows.length) {
      return Response.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return Response.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('GET /api/profil:', error);
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const userId = parseInt(session.user.id, 10);
    const db = await connectDB();

    // ── Changement de mot de passe (flux séparé) ──────────────────────────
    if (body.changerMotDePasse) {
      const { ancien_mot_de_passe, nouveau_mot_de_passe } = body;

      if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
        return Response.json({ success: false, error: 'Champs manquants' }, { status: 400 });
      }
      if (nouveau_mot_de_passe.length < 8) {
        return Response.json({ success: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
      }

      const [[userRow]] = await db.execute(
        'SELECT mot_de_passe FROM Utilisateur WHERE id_utilisateur = ?',
        [userId]
      );

      if (!userRow?.mot_de_passe) {
        return Response.json({ success: false, error: 'Impossible de vérifier le mot de passe actuel (compte Google ?)' }, { status: 400 });
      }

      const valid = await bcrypt.compare(ancien_mot_de_passe, userRow.mot_de_passe);
      if (!valid) {
        return Response.json({ success: false, error: 'Mot de passe actuel incorrect' }, { status: 400 });
      }

      const hashed = await bcrypt.hash(nouveau_mot_de_passe, 12);
      await db.execute(
        'UPDATE Utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?',
        [hashed, userId]
      );

      return Response.json({ success: true, message: 'Mot de passe modifié avec succès' });
    }

    // ── Mise à jour infos personnelles + entreprise ───────────────────────
    const {
      prenom, nom, telephone,
      entreprise_nom, entreprise_adresse,
      entreprise_email_contact, entreprise_pays, entreprise_telephone,
    } = body;

    await db.execute(
      'UPDATE Utilisateur SET prenom = ?, nom = ?, telephone = ? WHERE id_utilisateur = ?',
      [prenom || '', nom || '', telephone || null, userId]
    );

    const isAdmin = session.user.roleEntreprise === 1;
    if (isAdmin && session.user.entrepriseId) {
      const entrepriseId = parseInt(session.user.entrepriseId, 10);
      await db.execute(
        `UPDATE Entreprise SET nom = ?, adresse = ?, email_contact = ?, pays = ?, telephone = ?
         WHERE id_entreprise = ?`,
        [
          entreprise_nom || '',
          entreprise_adresse || null,
          entreprise_email_contact || null,
          entreprise_pays || null,
          entreprise_telephone || null,
          entrepriseId,
        ]
      );
    }

    return Response.json({ success: true, message: 'Profil mis à jour' });
  } catch (error) {
    console.error('PUT /api/profil:', error);
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
