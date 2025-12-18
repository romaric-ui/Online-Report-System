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
            'SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.mot_de_passe, u.provider, r.nom_role FROM Utilisateur u LEFT JOIN Role r ON u.id_role = r.id_role WHERE u.email = ?',
            [credentials.email]
          );
          
          await connection.end();
          
          if (users.length === 0) {
            console.log('❌ Utilisateur non trouvé:', credentials.email);
            return null;
          }
          
          const user = users[0];
          
          // Vérifier le mot de passe
          const isValid = await bcrypt.compare(credentials.password, user.mot_de_passe);
          
          if (!isValid) {
            console.log('❌ Mot de passe incorrect pour:', credentials.email);
            return null;
          }
          
          console.log('✅ Connexion credentials réussie:', {
            email: user.email,
            role: user.nom_role
          });
          
          return {
            id: user.id_utilisateur.toString(),
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: user.nom_role
          };
        } catch (error) {
          console.error('❌ Erreur authorize:', error);
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
            'SELECT * FROM Utilisateur WHERE email = ?',
            [user.email]
          );

          if (existingUsers.length === 0) {
            // Créer un nouvel utilisateur Google dans notre base de données
            const hashedPassword = await bcrypt.hash(user.id + 'google_oauth', 10); // Mot de passe unique basé sur Google ID
            
            console.log('🆕 Création nouvel utilisateur Google:', {
              email: user.email,
              nom: profile.family_name || user.name.split(' ').pop() || 'Utilisateur',
              prenom: profile.given_name || user.name.split(' ')[0] || 'Google'
            });

            const [result] = await connection.execute(
              'INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, provider_id, provider) VALUES (?, ?, ?, ?, ?, ?)',
              [
                profile.family_name || user.name.split(' ').pop() || 'Utilisateur',
                profile.given_name || user.name.split(' ')[0] || 'Google',
                user.email,
                hashedPassword,
                user.id,
                'google'
              ]
            );

            console.log('✅ Utilisateur Google créé avec ID:', result.insertId);
          } else {
            // Utilisateur existe déjà, lier le compte Google si pas encore fait
            const existingUser = existingUsers[0];
            
            if (!existingUser.provider_id) {
              console.log('🔗 Liaison compte Google existant:', user.email);
              
              await connection.execute(
                'UPDATE Utilisateur SET provider_id = ?, provider = ? WHERE email = ?',
                [user.id, 'google', user.email]
              );
            } else {
              console.log('✅ Compte Google déjà lié pour:', user.email);
            }

            console.log('✅ Connexion Google réussie pour:', user.email);
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
            'SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.provider_id, u.provider, u.date_creation, r.nom_role FROM Utilisateur u LEFT JOIN Role r ON u.id_role = r.id_role WHERE u.email = ?',
            [user.email]
          );
          
          if (users.length > 0) {
            const dbUser = users[0];
            token.userId = dbUser.id_utilisateur;
            token.nom = dbUser.nom;
            token.prenom = dbUser.prenom;
            token.email = dbUser.email;
            token.provider_id = dbUser.provider_id;
            token.role = dbUser.nom_role || 'user';
            token.isGoogleUser = dbUser.provider === 'google';
            
            console.log('🔐 Token JWT créé pour utilisateur:', {
              id: dbUser.id_utilisateur,
              email: dbUser.email,
              role: dbUser.nom_role,
              isGoogle: dbUser.provider === 'google'
            });
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
        
        console.log('👤 Session utilisateur:', {
          id: session.user.id,
          email: session.user.email,
          nom: session.user.nom,
          role: session.user.role,
          isGoogle: session.user.isGoogleUser
        });
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Rediriger vers la page d'accueil pour la connexion
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60, // 24 heures
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };