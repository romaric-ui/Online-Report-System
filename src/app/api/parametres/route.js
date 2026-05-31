import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { successResponse, errorResponse } from '../../../../lib/api-response.js';
import { requireTenant } from '../../../../lib/tenant.js';
import { connectDB } from '../../../../lib/database.js';
import { AuthenticationError, ValidationError } from '../../../../lib/errors/index.js';

const apiHandler = (handler) => async (request, context) => {
  try { return await handler(request, context); }
  catch (error) { return errorResponse(error, request); }
};

async function handleGET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');
  const entrepriseId = requireTenant(session);

  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT nom, slug, logo_url, couleur_principale, pied_page_rapport,
            adresse, telephone, email_contact, site_web, pays, devise
     FROM entreprise WHERE id_entreprise = ? LIMIT 1`,
    [entrepriseId]
  );
  return successResponse(rows[0] || {});
}

async function handlePUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');
  const entrepriseId = requireTenant(session);

  const body = await request.json();
  const { nom, logo_url, couleur_principale, pied_page_rapport, adresse, telephone, email_contact, site_web } = body;

  if (couleur_principale && !/^#[0-9A-Fa-f]{6}$/.test(couleur_principale)) {
    throw new ValidationError('Couleur invalide (format #RRGGBB requis)');
  }
  if (nom && nom.trim().length < 2) {
    throw new ValidationError('Nom trop court');
  }

  const db = await connectDB();
  await db.query(
    `UPDATE entreprise SET
      nom = COALESCE(?, nom),
      logo_url = ?,
      couleur_principale = ?,
      pied_page_rapport = ?,
      adresse = ?,
      telephone = ?,
      email_contact = ?,
      site_web = ?
     WHERE id_entreprise = ?`,
    [
      nom?.trim() || null,
      logo_url || null,
      couleur_principale || '#2563eb',
      pied_page_rapport || null,
      adresse || null,
      telephone || null,
      email_contact || null,
      site_web || null,
      entrepriseId,
    ]
  );

  return successResponse({ message: 'Paramètres mis à jour' });
}

export const GET = apiHandler(handleGET);
export const PUT = apiHandler(handlePUT);