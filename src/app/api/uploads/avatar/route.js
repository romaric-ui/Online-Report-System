import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { connectDB } from '../../../../../lib/database.js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file) {
      return Response.json({ success: false, error: 'Fichier manquant' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ success: false, error: 'Type de fichier non supporté (JPG, PNG, WEBP)' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ success: false, error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const ext = path.extname(file.name) || '.jpg';
    const filename = `avatar_${session.user.id}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const publicUrl = `/uploads/avatars/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const db = await connectDB();
    await db.execute(
      'UPDATE Utilisateur SET photo_url = ? WHERE id_utilisateur = ?',
      [publicUrl, parseInt(session.user.id, 10)]
    );

    return Response.json({ success: true, photo_url: publicUrl });
  } catch (error) {
    console.error('POST /api/uploads/avatar:', error);
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
