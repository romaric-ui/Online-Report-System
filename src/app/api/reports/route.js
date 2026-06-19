import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { reportRepo } from '../../../../lib/repositories/report.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../lib/errors/index.js';

const LIMITE_GRATUIT = 1; // 1 rapport gratuit pour le plan particulier gratuit

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

/**
 * Vérifie si un utilisateur particulier (sans entreprise) peut créer un rapport.
 * Approche COUNT dynamique : source de vérité = table Rapport.
 * Pas de colonne nb_rapports_inspection → pas de désynchro possible.
 */
async function checkLimiteParticulier(userId) {
  // Récupérer le plan et la date d'expiration
  const userRows = await reportRepo.raw(
    `SELECT abonnement_particulier, abonnement_particulier_expire_at
     FROM Utilisateur WHERE id_utilisateur = ? LIMIT 1`,
    [userId]
  );

  if (!userRows.length) return { bloque: true, raison: 'Utilisateur introuvable' };

  const user = userRows[0];
  const isAbonne = user.abonnement_particulier === 'pro'
    && user.abonnement_particulier_expire_at
    && new Date(user.abonnement_particulier_expire_at) > new Date();

  // Abonné pro → pas de limite
  if (isAbonne) return { bloque: false };

  // Compter les rapports existants (COUNT depuis la table = toujours exact)
  const countRows = await reportRepo.raw(
    `SELECT COUNT(*) AS total FROM Rapport WHERE id_utilisateur = ?`,
    [userId]
  );
  const total = Number(countRows[0]?.total ?? 0);

  if (total >= LIMITE_GRATUIT) {
    return {
      bloque: true,
      paywall: true,
      message: 'Limite gratuite atteinte. Abonnez-vous pour créer plus de rapports.',
    };
  }

  return { bloque: false };
}

async function handleGET() {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError('Non authentifié');

  const reports = await reportRepo.raw(
    `SELECT r.*, u.nom AS createur_nom, u.prenom AS createur_prenom
     FROM Rapport r
     JOIN utilisateur u ON r.id_utilisateur = u.id_utilisateur
     WHERE r.id_utilisateur = ?
     ORDER BY r.date_creation DESC`,
    [session.user.id]
  );

  return successResponse(reports);
}

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError('Non authentifié');

  const body = await request.json();
  const {
    numero_affaire, numero_rapport, nom_chantier, adresse_chantier,
    date_visite, phase, equipe_presente, materiel_utilise,
    objectifs_limites, deroulement, investigation, autres_points,
    conclusion, photo_couverture,
  } = body;

  if (!numero_affaire || !numero_rapport || !nom_chantier) {
    throw new ValidationError('Champs obligatoires manquants');
  }

  // Vérifier la limite pour les comptes particuliers (sans entreprise)
  if (!session.user.entrepriseId) {
    const limite = await checkLimiteParticulier(session.user.id);
    if (limite.bloque) {
      return new Response(
        JSON.stringify({ success: false, paywall: limite.paywall ?? false, message: limite.message ?? 'Accès refusé' }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const report = await reportRepo.create({
    id_utilisateur: session.user.id,
    numero_affaire,
    numero_rapport,
    nom_chantier,
    adresse_chantier: adresse_chantier || null,
    date_visite: date_visite || new Date().toISOString().split('T')[0],
    phase: phase || 'Réservé',
    equipe_presente: equipe_presente ? JSON.stringify(equipe_presente) : null,
    materiel_utilise: materiel_utilise ? JSON.stringify(materiel_utilise) : null,
    objectifs_limites: objectifs_limites || null,
    deroulement: deroulement || null,
    investigation: investigation ? JSON.stringify(investigation) : null,
    autres_points: autres_points ? JSON.stringify(autres_points) : null,
    conclusion: conclusion || null,
    photo_couverture: photo_couverture || null,
    statut: 'en_attente',
  });

  // ✅ Plus d'UPDATE nb_rapports_inspection — COUNT dynamique fait foi

  return createdResponse({ message: 'Rapport créé avec succès', id_rapport: report.id_rapport });
}

async function handlePUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError('Non authentifié');

  const body = await request.json();
  const { id_rapport, ...updateData } = body;

  if (!id_rapport) throw new ValidationError('ID rapport manquant');

  const report = await reportRepo.findById(id_rapport);
  if (report.id_utilisateur !== parseInt(session.user.id, 10)) {
    throw new AuthorizationError('Non autorisé à modifier ce rapport');
  }

  const ALLOWED_COLUMNS = new Set([
    'numero_affaire', 'numero_rapport', 'nom_chantier', 'adresse_chantier',
    'date_visite', 'phase', 'equipe_presente', 'materiel_utilise',
    'objectifs_limites', 'deroulement', 'investigation', 'autres_points',
    'conclusion', 'photo_couverture', 'statut', 'titre', 'description',
  ]);

  const fields = Object.keys(updateData).filter(
    (key) => updateData[key] !== undefined && ALLOWED_COLUMNS.has(key)
  );

  if (fields.length === 0) throw new ValidationError('Aucune donnée valide à mettre à jour');

  const sanitizedData = {};
  fields.forEach((field) => {
    sanitizedData[field] = typeof updateData[field] === 'object'
      ? JSON.stringify(updateData[field])
      : updateData[field];
  });

  await reportRepo.update(id_rapport, sanitizedData);

  return successResponse({ message: 'Rapport modifié avec succès' });
}

async function handleDELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) throw new AuthenticationError('Non authentifié');

  const { searchParams } = new URL(request.url);
  const id_rapport = searchParams.get('id');

  if (!id_rapport) throw new ValidationError('ID rapport manquant');

  const report = await reportRepo.findById(id_rapport);
  if (report.id_utilisateur !== parseInt(session.user.id, 10)) {
    throw new AuthorizationError('Non autorisé à supprimer ce rapport');
  }

  await reportRepo.delete(id_rapport);

  // ✅ Plus de décrémentation nb_rapports_inspection — COUNT dynamique fait foi

  return successResponse({ message: 'Rapport supprimé avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);