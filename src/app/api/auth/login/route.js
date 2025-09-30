// API de connexion des utilisateurs
import { connectDB } from '../../../../../lib/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  validateEmail, 
  validatePassword, 
  validateRequestBody
} from '../../../../../lib/security.js';
import { 
  handleApiError, 
  createAuthError, 
  createValidationError 
} from '../../../../../lib/error-handler.js';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validation générale du body
    const bodyValidation = validateRequestBody(body, ['email', 'password']);
    if (!bodyValidation.isValid) {
      const error = createValidationError(bodyValidation.error, { fields: ['email', 'password'] });
      const errorResponse = handleApiError(error, request);
      return Response.json(errorResponse, { status: error.statusCode });
    }

    const { email, password } = body;
    
    // Validation sécurisée des champs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const error = createValidationError('Format d\'email invalide', { field: 'email', value: email });
      const errorResponse = handleApiError(error, request);
      return Response.json(errorResponse, { status: error.statusCode });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const error = createValidationError('Mot de passe invalide', { field: 'password' });
      const errorResponse = handleApiError(error, request);
      return Response.json(errorResponse, { status: error.statusCode });
    }

    const db = await connectDB();

    const cleanEmail = emailValidation.value;
    const cleanPassword = passwordValidation.value;

    // Récupérer l'utilisateur avec son rôle (requête préparée sécurisée)
    const [users] = await db.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.mot_de_passe, 
              r.libelle as nom_role, u.id_role
       FROM Utilisateur u
       LEFT JOIN Role r ON u.id_role = r.id_role
       WHERE u.email = ? LIMIT 1`,
      [cleanEmail]
    );

    if (users.length === 0) {
      const error = createAuthError('Email ou mot de passe incorrect', { email: cleanEmail });
      const errorResponse = handleApiError(error, request);
      return Response.json(errorResponse, { status: error.statusCode });
    }

    const user = users[0];

    // Vérifier le mot de passe avec timing attack protection
    const isValidPassword = await bcrypt.compare(cleanPassword, user.mot_de_passe);
    
    if (!isValidPassword) {
      const error = createAuthError('Email ou mot de passe incorrect', { email: cleanEmail });
      const errorResponse = handleApiError(error, request);
      return Response.json(errorResponse, { status: error.statusCode });
    }

    // Générer un token JWT (optionnel, pour les sessions plus avancées)
    const token = jwt.sign(
      { 
        userId: user.id_utilisateur, 
        email: user.email,
        role: user.nom_role 
      },
      process.env.JWT_SECRET || 'votre-secret-jwt-temporaire',
      { expiresIn: '24h' }
    );

    // Note: Le champ derniere_connexion n'existe pas dans ta table, on l'ignore

    // Retourner les données utilisateur (sans le mot de passe)
    const userData = {
      id: user.id_utilisateur,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.nom_role,
      roleId: user.id_role
    };

    return Response.json(
      { 
        success: true,
        user: userData,
        token: token,
        message: 'Connexion réussie'
      },
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error, request);
    return Response.json(errorResponse, { status: errorResponse.statusCode || 500 });
  }
}