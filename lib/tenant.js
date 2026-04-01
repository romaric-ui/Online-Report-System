import { AuthenticationError } from './errors/index.js';

export function getTenantId(session) {
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }
  // Pour l'instant on retourne l'id_entreprise depuis la session
  // Il sera ajouté à la session dans la partie B
  return session.user.entrepriseId || session.user.id_entreprise;
}

export function requireTenant(session) {
  const tenantId = getTenantId(session);
  if (!tenantId) {
    throw new AuthenticationError('Entreprise non trouvée pour cet utilisateur');
  }
  return tenantId;
}
