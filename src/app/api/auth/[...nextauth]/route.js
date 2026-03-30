import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Configuration intelligente de base de données (local/Aiven)
const useLocalDb = process.env.USE_LOCAL_DB === 'true';
const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = (isProduction && !useLocalDb) ? {
  // Configuration PRODUCTION - Aiven
  host: process.env.AIVEN_HOST,
  user: process.env.AIVEN_USER,
  password: process.env.AIVEN_PASSWORD,
  database: process.env.AIVEN_DATABASE,
  port: process.env.AIVEN_PORT || 21094,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 60000,
  acquireTimeout: 60000,
} : {
  // Configuration DÉVELOPPEMENT - Local MySQL
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'onlinereports',
  port: 3306,
  ssl: false,
  connectTimeout: 60000,
};

// Créer une connexion à la base de données
async function getDbConnection() {
  return await mysql.createConnection(dbConfig);
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const connection = await getDbConnection();
          
          const [users] = await connection.execute(
            'SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.mot_de_passe, u.statut, u.provider, r.nom_role FROM Utilisateur u LEFT JOIN Role r ON u.id_role = r.id_role WHERE u.email = ?',
            [credentials.email]
          );
          
          await connection.end();
          
          if (users.length === 0) {
            return null;
          }
          
          const user = users[0];
          
          // Vérifier si le compte est bloqué
          if (user.statut === 'bloque') {
            throw new Error('ACCOUNT_BLOCKED');
          }
          
          // Vérifier le mot de passe
          const isValid = await bcrypt.compare(credentials.password, user.mot_de_passe);
          
          if (!isValid) {
            return null;
          }
          
          // Normaliser le rôle : 'Administrateur' → 'admin', sinon → 'user'
          const normalizedRole = user.nom_role === 'Administrateur' ? 'admin' : 'user';
          
          return {
            id: user.id_utilisateur.toString(),
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: normalizedRole
          };
        } catch (error) {
          if (error.message === 'ACCOUNT_BLOCKED') {
            throw error; // Propager pour que NextAuth renvoie l'erreur au client
          }
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account", // Force l'utilisateur à choisir un compte Google
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const connection = await getDbConnection();
          
          // Vérifier si l'utilisateur existe déjà
          const [existingUsers] = await connection.execute(
            'SELECT id_utilisateur, id_role, provider, provider_id FROM Utilisateur WHERE email = ?',
            [user.email]
          );

          if (existingUsers.length > 0) {
            // Vérifier si le compte est bloqué
            const existingUser = existingUsers[0];
            const [statusCheck] = await connection.execute(
              'SELECT statut FROM Utilisateur WHERE id_utilisateur = ?',
              [existingUser.id_utilisateur]
            );
            if (statusCheck.length > 0 && statusCheck[0].statut === 'bloque') {
              await connection.end();
              return '/api/auth/signin?error=ACCOUNT_BLOCKED';
            }
          }

          if (existingUsers.length === 0) {
            // Créer un nouvel utilisateur Google (toujours rôle utilisateur = 2)
            const hashedPassword = await bcrypt.hash(user.id + 'google_oauth', 10);

            await connection.execute(
              'INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, provider_id, provider, id_role) VALUES (?, ?, ?, ?, ?, ?, 2)',
              [
                profile.family_name || user.name.split(' ').pop() || 'Utilisateur',
                profile.given_name || user.name.split(' ')[0] || 'Google',
                user.email,
                hashedPassword,
                user.id,
                'google'
              ]
            );

          } else {
            const existingUser = existingUsers[0];
            
            // SÉCURITÉ : Bloquer la connexion Google si le compte est admin
            // L'admin ne peut se connecter que par email/mot de passe
            if (existingUser.id_role === 1) {
              await connection.end();
              return false;
            }

            // Lier le compte Google si pas encore fait (utilisateurs normaux uniquement)
            if (!existingUser.provider_id) {
              await connection.execute(
                'UPDATE Utilisateur SET provider_id = ?, provider = ? WHERE email = ?',
                [user.id, 'google', user.email]
              );
            } else {
            }

          }

          await connection.end();
          return true;
        } catch (error) {
          console.error('Erreur lors de la connexion Google:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        try {
          const connection = await getDbConnection();
          const [users] = await connection.execute(
            'SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.id_role, u.provider_id, u.provider, u.date_creation, r.nom_role FROM Utilisateur u LEFT JOIN Role r ON u.id_role = r.id_role WHERE u.email = ?',
            [user.email]
          );
          
          if (users.length > 0) {
            const dbUser = users[0];
            token.userId = dbUser.id_utilisateur;
            token.nom = dbUser.nom;
            token.prenom = dbUser.prenom;
            token.email = dbUser.email;
            token.provider_id = dbUser.provider_id;
            token.isGoogleUser = dbUser.provider === 'google';

            // Normaliser le rôle : 'Administrateur' → 'admin', sinon → 'user'
            token.role = dbUser.id_role === 1 ? 'admin' : 'user';
          }
          
          await connection.end();
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.nom = token.nom;
        session.user.prenom = token.prenom;
        session.user.email = token.email;
        session.user.role = token.role || 'user';
        session.user.isGoogleUser = token.isGoogleUser;
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Rediriger vers la page d'accueil pour la connexion
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
    updateAge: 24 * 60 * 60, // 24 heures
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };