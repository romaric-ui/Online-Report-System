import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';

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
          const user = await userRepo.findByEmail(credentials.email);

          if (!user) {
            return null;
          }

          if (user.statut === 'bloque') {
            throw new Error('ACCOUNT_BLOCKED');
          }

          const isValid = await bcrypt.compare(credentials.password, user.mot_de_passe);
          if (!isValid) {
            return null;
          }

          const normalizedRole = user.id_role === 1 ? 'admin' : 'user';

          return {
            id: user.id_utilisateur.toString(),
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: normalizedRole
          };
        } catch (error) {
          if (error.message === 'ACCOUNT_BLOCKED') {
            throw error;
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
          prompt: "select_account",
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
          const existingUser = await userRepo.findByEmail(user.email);

          if (existingUser) {
            if (existingUser.statut === 'bloque') {
              return '/api/auth/signin?error=ACCOUNT_BLOCKED';
            }

            if (existingUser.id_role === 1) {
              return false;
            }

            if (!existingUser.provider_id) {
              await userRepo.raw(
                'UPDATE Utilisateur SET provider_id = ?, provider = ? WHERE email = ?',
                [user.id, 'google', user.email]
              );
            }

            return true;
          }

          await userRepo.createGoogleUser(profile);
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
          const dbUser = await userRepo.findByEmail(user.email);
          if (dbUser) {
            token.userId = dbUser.id_utilisateur;
            token.nom = dbUser.nom;
            token.prenom = dbUser.prenom;
            token.email = dbUser.email;
            token.provider_id = dbUser.provider_id;
            token.isGoogleUser = dbUser.provider === 'google';
            token.role = dbUser.id_role === 1 ? 'admin' : 'user';
            token.entrepriseId = dbUser.id_entreprise;
            token.roleEntreprise = dbUser.id_role_entreprise;
          }
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
        session.user.entrepriseId = token.entrepriseId;
        session.user.roleEntreprise = token.roleEntreprise;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
