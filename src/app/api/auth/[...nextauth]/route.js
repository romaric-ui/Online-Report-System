import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Configuration intelligente de base de données (local/Aiven)
const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = isProduction ? {
  // Configuration PRODUCTION - Aiven
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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

const handler = NextAuth({
  providers: [
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
            'SELECT * FROM utilisateur WHERE email = ?',
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
              'INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, google_id, date_creation) VALUES (?, ?, ?, ?, ?, NOW())',
              [
                profile.family_name || user.name.split(' ').pop() || 'Utilisateur',
                profile.given_name || user.name.split(' ')[0] || 'Google',
                user.email,
                hashedPassword,
                user.id
              ]
            );

            console.log('✅ Utilisateur Google créé avec ID:', result.insertId);
          } else {
            // Utilisateur existe déjà, lier le compte Google si pas encore fait
            const existingUser = existingUsers[0];
            
            if (!existingUser.google_id) {
              console.log('🔗 Liaison compte Google existant:', user.email);
              
              await connection.execute(
                'UPDATE utilisateur SET google_id = ?, derniere_connexion = NOW() WHERE email = ?',
                [user.id, user.email]
              );
            } else {
              // Juste mettre à jour la dernière connexion
              await connection.execute(
                'UPDATE utilisateur SET derniere_connexion = NOW() WHERE email = ?',
                [user.email]
              );
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
            'SELECT id_utilisateur, nom, prenom, email, google_id, date_creation FROM utilisateur WHERE email = ?',
            [user.email]
          );
          
          if (users.length > 0) {
            const dbUser = users[0];
            token.userId = dbUser.id_utilisateur;
            token.nom = dbUser.nom;
            token.prenom = dbUser.prenom;
            token.email = dbUser.email;
            token.google_id = dbUser.google_id;
            token.isGoogleUser = !!dbUser.google_id;
            
            console.log('🔐 Token JWT créé pour utilisateur:', {
              id: dbUser.id,
              email: dbUser.email,
              isGoogle: !!dbUser.google_id
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
        session.user.isGoogleUser = token.isGoogleUser;
        
        console.log('👤 Session utilisateur:', {
          id: session.user.id,
          email: session.user.email,
          nom: session.user.nom,
          isGoogle: session.user.isGoogleUser
        });
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Rediriger vers la page d'accueil pour la connexion
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };