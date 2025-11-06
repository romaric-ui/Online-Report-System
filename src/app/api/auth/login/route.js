// API de connexion des utilisateurs
import { connectDB } from '../../../../../lib/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validations simples
    if (!email || !password) {
      return Response.json({
        success: false,
        error: 'Email et mot de passe requis'
      }, { status: 400 });
    }

    const db = await connectDB();

    // Récupérer l'utilisateur avec son rôle
    const [users] = await db.execute(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.mot_de_passe, 
              r.nom_role, u.id_role
       FROM Utilisateur u
       LEFT JOIN Role r ON u.id_role = r.id_role
       WHERE u.email = ? LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return Response.json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      }, { status: 401 });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.mot_de_passe);
    
    if (!isValidPassword) {
      return Response.json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      }, { status: 401 });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: user.id_utilisateur, 
        email: user.email,
        role: user.nom_role 
      },
      process.env.JWT_SECRET || 'votre-secret-jwt-temporaire',
      { expiresIn: '24h' }
    );

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
    console.error('❌ Erreur connexion:', error);
    
    return Response.json({
      success: false,
      error: 'Une erreur est survenue lors de la connexion. Veuillez réessayer.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}