import { getServerSession } from 'next-auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { documentRepo } from '../../../../../../lib/repositories/document.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError } from '../../../../../../lib/errors/index.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'dwg',
]);

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/acad',
  'image/vnd.dwg',
  'application/octet-stream', // DWG parfois détecté ainsi
]);

const CATEGORIES_VALIDES = new Set([
  'plan', 'contrat', 'devis', 'facture', 'permis',
  'pv_reception', 'rapport', 'autre',
]);

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

// ── GET ───────────────────────────────────────────────────────────────────────

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const page      = Math.max(parseInt(searchParams.get('page')  || '1',  10), 1);
  const limit     = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const categorie = searchParams.get('categorie') || undefined;

  const documents = await documentRepo.findByChantier(chantierId, { page, limit, categorie });
  const comptes   = await documentRepo.countByCategorie(chantierId);

  return successResponse({ documents, comptes });
}

// ── POST ──────────────────────────────────────────────────────────────────────

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1, 2]); // admin entreprise + chef de chantier
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const formData  = await request.formData();
  const file      = formData.get('file');
  const categorie = formData.get('categorie');
  const description = formData.get('description') || null;

  if (!file || typeof file === 'string') throw new ValidationError('Fichier requis');
  if (!categorie || !CATEGORIES_VALIDES.has(categorie)) {
    throw new ValidationError('Catégorie invalide');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('Fichier trop volumineux (max 10 Mo)');
  }

  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ValidationError(`Format non accepté. Formats valides : ${[...ALLOWED_EXTENSIONS].join(', ')}`);
  }

  // Créer le dossier de destination
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chantiers', String(chantierId), 'documents');
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Nom de fichier unique
  const timestamp    = Date.now();
  const random       = Math.random().toString(36).substring(2, 8);
  const nomFichier   = `${timestamp}_${random}.${ext}`;
  const cheminComplet = path.join(uploadDir, nomFichier);
  const cheminRelatif = `/uploads/chantiers/${chantierId}/documents/${nomFichier}`;

  // Écrire sur le disque
  const bytes  = await file.arrayBuffer();
  await writeFile(cheminComplet, Buffer.from(bytes));

  // Enregistrer en base
  const doc = await documentRepo.create({
    id_chantier:    chantierId,
    nom_fichier:    nomFichier,
    nom_original:   file.name,
    chemin_fichier: cheminRelatif,
    type_mime:      file.type || null,
    taille_fichier: file.size,
    categorie,
    description,
    version:        1,
    uploaded_by:    parseInt(session.user.id, 10),
  });

  return createdResponse({ id_document: doc.id_document, message: 'Document uploadé avec succès' });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

async function handleDELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  requireRole(session, [1, 2]); // admin entreprise + chef de chantier
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const idDoc = parseInt(searchParams.get('id_document'), 10);
  if (!idDoc || Number.isNaN(idDoc)) throw new ValidationError('id_document manquant');

  const doc = await documentRepo.findById(idDoc);
  if (parseInt(doc.id_chantier, 10) !== chantierId) {
    throw new AuthorizationError('Non autorisé pour ce document');
  }

  // Supprimer le fichier physique
  const cheminComplet = path.join(process.cwd(), 'public', doc.chemin_fichier);
  if (existsSync(cheminComplet)) {
    await unlink(cheminComplet);
  }

  await documentRepo.delete(idDoc);
  return successResponse({ message: 'Document supprimé avec succès' });
}

export const GET    = apiHandler(handleGET);
export const POST   = apiHandler(handlePOST);
export const DELETE = apiHandler(handleDELETE);
