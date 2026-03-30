// API de connexion des utilisateurs
import { connectDB } from '../../../../../lib/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimitCheck } from '../../../../../lib/security.js';
import { SECURITY_CONFIG, SECURITY_MESSAGES } from '../../../../../lib/security-config.js';

export async function POST(request) {
  try {
    // Rate limiting par IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const rateLimit = rateLimitCheck(
      ip,
      SECURITY_CONFIG.rateLimits.login.maxAttempts,
      SECURITY_CONFIG.rateLimits.login.windowMs
    );
    if (!rateLimit.allowed) {
      return Response.json({
        success: false,
        error: SECURITY_MESSAGES.rateLimitExceeded
      }, { status: 429 });
    }

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

    // Normaliser le rôle : 'Administrateur' → 'admin', sinon → 'user'
    const normalizedRole = user.nom_role === 'Administrateur' ? 'admin' : 'user';

    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: user.id_utilisateur, 
        email: user.email,
        role: normalizedRole 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner les données utilisateur (sans le mot de passe)
    const userData = {
      id: user.id_utilisateur,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: normalizedRole,
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
    console.error('Erreur connexion');
    
    return Response.json({
      success: false,
      error: 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
    }, { status: 500 });
  }
}