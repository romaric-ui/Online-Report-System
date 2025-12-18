// Middleware pour protéger les routes admin
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      authorized: false,
      redirect: '/',
      message: 'Vous devez être connecté pour accéder à cette page'
    };
  }
  
  // Vérifier si l'utilisateur est admin (id_role = 1)
  if (session.user.id_role !== 1) {
    return {
      authorized: false,
      redirect: '/',
      message: 'Accès refusé : droits administrateur requis'
    };
  }
  
  return {
    authorized: true,
    user: session.user
  };
}
