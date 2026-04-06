import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

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

async function getOrCreateConversation(chantierId) {
  const rows = await chantierRepo.raw(
    'SELECT id_conversation FROM Conversation WHERE id_chantier = ? LIMIT 1',
    [chantierId]
  );
  if (rows.length > 0) return rows[0].id_conversation;

  // Créer la conversation si elle n'existe pas
  const chantier = await chantierRepo.findById(chantierId);
  const result = await chantierRepo.raw(
    'INSERT INTO Conversation (id_chantier, titre) VALUES (?, ?)',
    [chantierId, `Discussion - ${chantier.nom}`]
  );
  return result.insertId;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId   = await parseChantierId(params);

  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  const conversationId = await getOrCreateConversation(chantierId);

  const messages = await chantierRepo.raw(
    `SELECT
       m.id_message,
       m.contenu,
       m.type_message,
       m.fichier_url,
       m.lu,
       m.created_at,
       m.id_utilisateur,
       u.nom,
       u.prenom
     FROM ChatMessage m
     INNER JOIN Utilisateur u ON m.id_utilisateur = u.id_utilisateur
     WHERE m.id_conversation = ?
     ORDER BY m.created_at ASC
     LIMIT ? OFFSET ?`,
    [conversationId, limit, offset]
  );

  const [countRow] = await chantierRepo.raw(
    'SELECT COUNT(*) AS total FROM ChatMessage WHERE id_conversation = ?',
    [conversationId]
  );

  return successResponse(
    { conversation_id: conversationId, messages, chantier_nom: chantier.nom },
    200,
    { page, limit, total: countRow.total }
  );
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');

  const entrepriseId = requireTenant(session);
  const chantierId   = await parseChantierId(params);

  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }

  const body = await request.json();
  const contenu = body.contenu?.trim();
  if (!contenu) throw new ValidationError('Le contenu du message est requis');

  const type_message = ['texte', 'photo', 'document'].includes(body.type_message)
    ? body.type_message
    : 'texte';
  const fichier_url  = body.fichier_url || null;
  const userId       = parseInt(session.user.id, 10);

  const conversationId = await getOrCreateConversation(chantierId);

  const result = await chantierRepo.raw(
    `INSERT INTO ChatMessage (id_conversation, id_utilisateur, contenu, type_message, fichier_url)
     VALUES (?, ?, ?, ?, ?)`,
    [conversationId, userId, contenu, type_message, fichier_url]
  );

  const [message] = await chantierRepo.raw(
    `SELECT
       m.id_message, m.contenu, m.type_message, m.fichier_url, m.lu, m.created_at,
       m.id_utilisateur, u.nom, u.prenom
     FROM ChatMessage m
     INNER JOIN Utilisateur u ON m.id_utilisateur = u.id_utilisateur
     WHERE m.id_message = ?`,
    [result.insertId]
  );

  return createdResponse(message);
}

export const GET  = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
