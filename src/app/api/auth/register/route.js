// API d'inscription des utilisateurs
import { connectDB } from '../../../../../lib/database.js';
import bcrypt from 'bcryptjs';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateRequestBody
} from '../../../../../lib/security.js';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validation générale du body
    const bodyValidation = validateRequestBody(body, ['nom', 'prenom', 'email', 'password']);
    if (!bodyValidation.isValid) {
      return Response.json(
        { error: bodyValidation.error },
        { status: 400 }
      );
    }

    const { nom, prenom, email, password } = body;
    
    // Validation sécurisée de chaque champ
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return Response.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return Response.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const nomValidation = validateName(nom, 'Nom');
    if (!nomValidation.isValid) {
      return Response.json(
        { error: nomValidation.error },
        { status: 400 }
      );
    }

    const prenomValidation = validateName(prenom, 'Prénom');
    if (!prenomValidation.isValid) {
      return Response.json(
        { error: prenomValidation.error },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Utiliser les valeurs nettoyées
    const cleanEmail = emailValidation.value;
    const cleanNom = nomValidation.value;
    const cleanPrenom = prenomValidation.value;
    const cleanPassword = passwordValidation.value;

    // Vérifier si l'utilisateur existe déjà (requête préparée sécurisée)
    const [existingUser] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (existingUser.length > 0) {
      return Response.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      );
    }

    // Hasher le mot de passe avec salt fort
    const hashedPassword = await bcrypt.hash(cleanPassword, 12);

    // Créer l'utilisateur avec requête préparée sécurisée
    const [result] = await db.execute(
      `INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role) 
       VALUES (?, ?, ?, ?, ?)`,
      [cleanNom, cleanPrenom, cleanEmail, hashedPassword, 2]
    );

    return Response.json(
      { 
        success: true, 
        message: 'Compte créé avec succès',
        userId: result.insertId 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur inscription:', error);
    return Response.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}