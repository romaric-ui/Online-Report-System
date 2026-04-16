import { AuthenticationError, AuthorizationError } from './errors/index.js';

export function getTenantId(session) {
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }
  return session.user.entrepriseId || session.user.id_entreprise;
}

export function requireTenant(session) {
  const tenantId = getTenantId(session);
  if (!tenantId) {
    throw new AuthenticationError('Entreprise non trouvée pour cet utilisateur');
  }
  return tenantId;
}

/**
 * Vérifie que le membre connecté possède l'un des rôles entreprise autorisés.
 * Rôles : 1 = admin entreprise, 2 = chef de chantier, 3 = conducteur de travaux, 4 = ouvrier
 *
 * @param {object} session - Session NextAuth
 * @param {number[]} allowedRoles - Tableau des id_role_entreprise autorisés
 */
export function requireRole(session, allowedRoles) {
  const roleEntreprise = parseInt(session?.user?.roleEntreprise, 10);
  if (!roleEntreprise || !allowedRoles.includes(roleEntreprise)) {
    throw new AuthorizationError("Vous n'avez pas les droits pour cette action");
  }
}
