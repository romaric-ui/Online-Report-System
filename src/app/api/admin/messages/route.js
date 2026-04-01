import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { messageRepo } from '../../../../../lib/repositories/message.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../lib/api-response.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../lib/errors/index.js';
import { sendMessageNotificationEmail } from '../../../../../lib/email-service.js';

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    throw new AuthorizationError('Accès non autorisé');
  }
  return session;
}

async function handleGET(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const statut = searchParams.get('statut');
  const messages = await messageRepo.findAll({ statut });
  return successResponse({ messages });
}

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError('Non authentifié');
  }

  const body = await request.json();
  const { sujet, contenu } = body;
  if (!sujet || !contenu) {
    throw new ValidationError('Sujet et contenu requis');
  }

  const message = await messageRepo.create({
    id_utilisateur: session.user.id,
    sujet,
    contenu,
    statut: 'non_lu',
    date_creation: new Date().toISOString().slice(0, 19).replace('T', ' ')
  });

  const userRows = await messageRepo.raw(
    'SELECT nom, prenom, email FROM Utilisateur WHERE id_utilisateur = ?',
    [session.user.id]
  );
  const user = userRows[0];

  try {
    if (user) {
      await sendMessageNotificationEmail(
        'admin@sgtec.com',
        `${user.prenom} ${user.nom}`,
        user.email,
        sujet,
        contenu
      );
    }
  } catch (emailError) {
    console.error('⚠️ Erreur envoi email notification:', emailError);
  }

  return createdResponse({
    message: 'Message envoyé avec succès',
    id_message: message.id_message
  });
}

async function handlePUT(request) {
  await requireAdmin();
  const body = await request.json();
  const { id_message, statut } = body;

  if (!id_message || !statut) {
    throw new ValidationError('ID message et statut requis');
  }

  if (!['lu', 'traite'].includes(statut)) {
    throw new ValidationError('Statut invalide');
  }

  await messageRepo.raw(
    'UPDATE Message SET statut = ?, date_lecture = NOW() WHERE id_message = ?',
    [statut, id_message]
  );

  return successResponse({ message: 'Message mis à jour avec succès' });
}

async function handleDELETE(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const id_message = searchParams.get('id_message');

  if (!id_message) {
    throw new ValidationError('ID du message requis');
  }

  await messageRepo.delete(id_message);
  return successResponse({ message: 'Message supprimé avec succès' });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
export const PUT = apiHandler(handlePUT);
export const DELETE = apiHandler(handleDELETE);
