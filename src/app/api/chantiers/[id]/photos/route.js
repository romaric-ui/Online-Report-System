import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { BaseRepository } from '../../../../../../lib/repositories/base.repository.js';
import { chantierRepo } from '../../../../../../lib/repositories/chantier.repository.js';
import { successResponse, createdResponse, errorResponse } from '../../../../../../lib/api-response.js';
import { requireTenant, requireRole } from '../../../../../../lib/tenant.js';
import { AuthenticationError, AuthorizationError, ValidationError } from '../../../../../../lib/errors/index.js';

const photoRepo = new BaseRepository('PhotoChantier', 'id_photo');

const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return errorResponse(error, request);
  }
};

async function parseChantierId(params) {
  const resolvedParams = await params;
  const chantierId = parseInt(resolvedParams.id, 10);
  if (!chantierId || Number.isNaN(chantierId) || chantierId <= 0) {
    throw new ValidationError('ID chantier invalide');
  }
  return chantierId;
}

async function verifyChantierEntreprise(chantierId, entrepriseId) {
  const chantier = await chantierRepo.findById(chantierId);
  if (parseInt(chantier.id_entreprise, 10) !== parseInt(entrepriseId, 10)) {
    throw new AuthorizationError('Non autorisé pour ce chantier');
  }
  return chantier;
}

function parseBase64Image(base64Image) {
  const matches = base64Image.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!matches) {
    throw new ValidationError('Image en base64 invalide');
  }
  const mimeType = matches[1];
  const data = matches[2];
  const extension = mimeType.split('/')[1] || 'jpg';
  return { buffer: Buffer.from(data, 'base64'), extension };
}

async function parsePhotoRequest(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return request.json();
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    return {
      type_photo: formData.get('type_photo')?.toString(),
      legende: formData.get('legende')?.toString(),
      latitude: formData.get('latitude')?.toString(),
      longitude: formData.get('longitude')?.toString(),
      id_journal: formData.get('id_journal')?.toString(),
      file,
    };
  }

  throw new ValidationError('Content-Type non supporté. Utilisez application/json ou multipart/form-data');
}

async function savePhotoFile(chantierId, fileData) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chantiers', String(chantierId));
  await fs.promises.mkdir(uploadDir, { recursive: true });

  let filename;
  let buffer;

  if (fileData.file) {
    const file = fileData.file;
    if (typeof file.arrayBuffer !== 'function') {
      throw new ValidationError('Fichier invalide');
    }
    buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || `photo_${Date.now()}.jpg`;
    const ext = path.extname(originalName) || '.jpg';
    filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  } else if (fileData.base64Image) {
    const parsed = parseBase64Image(fileData.base64Image);
    buffer = parsed.buffer;
    filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${parsed.extension}`;
  } else {
    throw new ValidationError('Fichier photo requis');
  }

  const filePath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/chantiers/${chantierId}/${filename}`;
}

async function handleGET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const { searchParams } = new URL(request.url);
  const typePhoto = searchParams.get('type_photo') || undefined;
  const whereClauses = ['id_chantier = ?'];
  const paramsSql = [chantierId];

  if (typePhoto) {
    whereClauses.push('type_photo = ?');
    paramsSql.push(typePhoto);
  }

  const photos = await photoRepo.raw(
    `SELECT * FROM PhotoChantier WHERE ${whereClauses.join(' AND ')} ORDER BY created_at DESC`,
    paramsSql
  );

  return successResponse(photos);
}

async function handlePOST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError('Non authentifié');
  }

  const entrepriseId = requireTenant(session);
  requireRole(session, [1, 2]); // admin entreprise + chef de chantier
  const chantierId = await parseChantierId(params);
  await verifyChantierEntreprise(chantierId, entrepriseId);

  const body = await parsePhotoRequest(request);
  const { type_photo, legende, latitude, longitude, id_journal, base64Image } = body;

  const url = await savePhotoFile(chantierId, { file: body.file, base64Image });

  const photo = await photoRepo.create({
    id_chantier: chantierId,
    id_journal: id_journal ? parseInt(id_journal, 10) : null,
    type_photo: type_photo || 'general',
    url,
    legende: legende || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    prise_par: parseInt(session.user.id, 10),
  });

  return createdResponse({ message: 'Photo créée avec succès', id_photo: photo.id_photo, url });
}

export const GET = apiHandler(handleGET);
export const POST = apiHandler(handlePOST);
