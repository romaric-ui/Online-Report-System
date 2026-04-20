import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/options';
import { stockSecuriteRepo } from '../../../../../../../lib/repositories/stock-securite.repository.js';
import { chantierRepo } from '../../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function parseChantierId(params) {
  const resolved = await params;
  const id = parseInt(resolved.id, 10);
  if (!id || Number.isNaN(id) || id <= 0) throw new ValidationError('ID chantier invalide');
  return id;
}

async function verifyChantierEntreprise(chantierId, entrepriseId) {
  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }
  return chantier;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get('categorie') || undefined;
  const etat      = searchParams.get('etat') || undefined;

  const [stock, alertes] = await Promise.all([
    stockSecuriteRepo.findByChantier(chantierId, { categorie, etat }),
    stockSecuriteRepo.findAlertesStock(chantierId),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const ruptures          = alertes.filter(a => a.quantite <= a.quantite_min).length;
  const verificationsDs   = alertes.filter(a => a.date_prochaine_verification && a.date_prochaine_verification <= today).length;
  const perimes           = alertes.filter(a => a.date_peremption && a.date_peremption <= today).length;

  return successResponse({ stock, alertes: { ruptures, verificationsDs, perimes, detail: alertes } });
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const {
    nom_article, categorie, quantite,
    quantite_min, unite, emplacement, etat,
    date_peremption, frequence_verification_jours, notes,
  } = body;

  if (!nom_article) throw new ValidationError('nom_article est requis');
  if (!categorie)   throw new ValidationError('categorie est requise');
  if (quantite === undefined || quantite === null) throw new ValidationError('quantite est requise');

  const freq = parseInt(frequence_verification_jours || 90, 10);
  const prochaine = new Date();
  prochaine.setDate(prochaine.getDate() + freq);

  const article = await stockSecuriteRepo.create({
    id_chantier:                 chantierId,
    nom_article,
    categorie,
    quantite:                    parseInt(quantite, 10),
    quantite_min:                parseInt(quantite_min || 0, 10),
    unite:                       unite || 'unité',
    emplacement:                 emplacement || null,
    etat:                        etat || 'bon',
    date_peremption:             date_peremption || null,
    frequence_verification_jours: freq,
    date_prochaine_verification: prochaine.toISOString().slice(0, 10),
    notes:                       notes || null,
    responsable:                 parseInt(session.user.id, 10),
  });

  return createdResponse(article);
}

async function handlePUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await request.json();
  const { id_stock, ...updates } = body;
  if (!id_stock) throw new ValidationError('id_stock est requis');

  const existing = await stockSecuriteRepo.findById(id_stock);
  if (parseInt(existing.id_chantier, 10) !== chantierId) throw new AuthorizationError('Non autorisé');

  const allowed = ['nom_article','categorie','quantite','quantite_min','unite','emplacement','etat',
                   'date_peremption','date_prochaine_verification','frequence_verification_jours','notes'];
  const data = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) data[k] = updates[k];
  }

  await stockSecuriteRepo.update(id_stock, data);
  return successResponse({ message: 'Article mis à jour' });
}

async function handleDELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const id_stock = parseInt(searchParams.get('id_stock'), 10);
  if (!id_stock) throw new ValidationError('id_stock est requis');

  const existing = await stockSecuriteRepo.findById(id_stock);
  if (parseInt(existing.id_chantier, 10) !== chantierId) throw new AuthorizationError('Non autorisé');

  await stockSecuriteRepo.delete(id_stock);
  return successResponse({ message: 'Article supprimé' });
}

export const GET    = apiHandler(handleGET);
export const POST   = apiHandler(handlePOST);
export const PUT    = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
