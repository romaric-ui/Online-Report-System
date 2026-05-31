import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { successResponse, errorResponse } from '../../../../lib/api-response.js';
import { requireTenant } from '../../../../lib/tenant.js';
import db from '../../../../lib/database.js';
import { AuthenticationError, ValidationError } from '../../../../lib/errors/index.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const apiHandler = (handler) => async (request, context) => {
  try { return await handler(request, context); }
  catch (error) { return errorResponse(error, request); }
};

async function handlePOST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthenticationError('Non authentifié');
  const entrepriseId = requireTenant(session);

  const formData = await request.formData();
  const file = formData.get('logo');

  if (!file) throw new ValidationError('Aucun fichier fourni');

  const type = file.type || '';
  if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'].includes(type)) {
    throw new ValidationError('Format accepté : PNG, JPG, SVG, WEBP');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new ValidationError('Taille max : 2 MB');
  }

  const ext = type === 'image/svg+xml' ? 'svg' : type === 'image/webp' ? 'webp' : type === 'image/png' ? 'png' : 'jpg';
  const filename = `logo_${entrepriseId}_${Date.now()}.${ext}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos');

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);

  const logo_url = `/uploads/logos/${filename}`;
  await db.query(`UPDATE entreprise SET logo_url = ? WHERE id_entreprise = ?`, [logo_url, entrepriseId]);

  return successResponse({ logo_url });
}

export const POST = apiHandler(handlePOST);