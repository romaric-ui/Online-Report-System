// Page d'arrivée après connexion, selon le profil de la session.
// Seule source de vérité : utilisée par l'accueil, la fenêtre de connexion
// et la vérification d'email.
export function homeUrlFor(user) {
  if (user?.role === 'admin') return '/admin/dashboard';
  if (user?.roleEntreprise === 1) return '/dashboard-projet';
  return '/dashboard';
}
