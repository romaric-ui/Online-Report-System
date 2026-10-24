import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { userRepo } from '../../../../../lib/repositories/user.repository.js';
import { rateLimitCheck, rateLimitReset, getClientIp } from '../../../../../lib/security.js';
import { SECURITY_CONFIG } from '../../../../../lib/security-config.js';

// Le jeton relit le compte en base au plus une fois par minute :
// un blocage, un changement de rôle ou d'entreprise s'applique sans reconnexion.
const TOKEN_REFRESH_MS = 60 * 1000;

function applyDbUser(token, dbUser) {
  token.userId = dbUser.id_utilisateur;
  token.nom = dbUser.nom;
  token.prenom = dbUser.prenom;
  token.email = dbUser.email;
  token.provider_id = dbUser.provider_id;
  token.isGoogleUser = dbUser.provider === 'google';
  token.role = dbUser.id_role === 1 ? 'admin' : 'user';
  token.entrepriseId = dbUser.id_entreprise;
  token.roleEntreprise = dbUser.id_role_entreprise != null ? parseInt(dbUser.id_role_entreprise, 10) : null;
  token.photoUrl = dbUser.photo_url || null;
  token.blocked = dbUser.statut === 'bloque';
  token.refreshedAt = Date.now();
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          const email = String(credentials?.email || '').trim().toLowerCase();
          if (!email || !credentials?.password) return null;

          // Limite par email (non falsifiable) et par IP
          const { login } = SECURITY_CONFIG.rateLimits;
          const ip = getClientIp(req?.headers);
          const byEmail = rateLimitCheck(`login:${email}`, login.maxAttempts, login.windowMs);
          const byIp = rateLimitCheck(`login-ip:${ip}`, login.maxAttemptsPerIp, login.windowMs);
          if (!byEmail.allowed || !byIp.allowed) {
            throw new Error('RATE_LIMITED');
          }

          const user = await userRepo.findByEmail(email);

          if (!user) return null;

          // Mot de passe vérifié AVANT le statut : sans le bon mot de passe,
          // on ne révèle pas qu'un compte est bloqué ou non vérifié
          const isValid = await bcrypt.compare(credentials.password, user.mot_de_passe);
          if (!isValid) return null;

          rateLimitReset(`login:${email}`);

          if (user.statut === 'bloque') {
            throw new Error('ACCOUNT_BLOCKED');
          }

          // ✅ NEW: bloquer si email non vérifié (uniquement pour login credentials,
          // Google a déjà validé l'email côté provider donc createGoogleUser pose email_verifie=1)
          if (Number(user.email_verifie) !== 1) {
            throw new Error('EMAIL_NOT_VERIFIED');
          }

          const normalizedRole = user.id_role === 1 ? 'admin' : 'user';

          return {
            id: user.id_utilisateur.toString(),
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: normalizedRole
          };
        } catch (error) {
          // Erreurs metier remontees telles quelles vers NextAuth
          if (['ACCOUNT_BLOCKED', 'EMAIL_NOT_VERIFIED', 'RATE_LIMITED'].includes(error.message)) throw error;
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
              // L'accueil lit ?error= pour afficher le message dans la fenêtre de connexion
              return '/?error=ACCOUNT_BLOCKED';
            }
            if (existingUser.id_role === 1) {
              return false;
            }
            if (!existingUser.provider_id) {
              await userRepo.raw(
                'UPDATE Utilisateur SET provider_id = ?, provider = ?, email_verifie = 1 WHERE email = ?',
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

    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          const dbUser = await userRepo.findByEmail(user.email);
          if (dbUser) applyDbUser(token, dbUser);
        } else if (
          token.userId &&
          (trigger === 'update' || Date.now() - (token.refreshedAt || 0) > TOKEN_REFRESH_MS)
        ) {
          const dbUser = await userRepo.findOneBy('id_utilisateur = ?', [token.userId]);
          if (dbUser) applyDbUser(token, dbUser);
          else token.blocked = true; // compte supprimé
        }
      } catch (error) {
        // Base indisponible : on garde le jeton tel quel plutôt que de déconnecter
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      }
      return token;
    },

    async session({ session, token }) {
      // Compte bloqué ou supprimé : session sans identité, les API répondent 401
      // et le middleware déconnecte au prochain chargement de page
      if (token?.blocked) {
        return { expires: session.expires, user: {}, blocked: true };
      }
      if (token) {
        session.user.id = token.userId;
        session.user.nom = token.nom;
        session.user.prenom = token.prenom;
        session.user.email = token.email;
        session.user.role = token.role || 'user';
        session.user.isGoogleUser = token.isGoogleUser;
        session.user.entrepriseId = token.entrepriseId;
        session.user.roleEntreprise = token.roleEntreprise;
        session.user.photoUrl = token.photoUrl || null;
        session.user.needsOnboarding = !token.entrepriseId && token.isGoogleUser;
      }
      return session;
    }
  },

  pages: {
    signIn: '/',
    newUser: '/bienvenue',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};