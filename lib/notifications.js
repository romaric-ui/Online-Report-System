// API pour créer une notification
import { connectDB } from './database.js';

export async function createNotification({ userId, type, titre, contenu, lien }) {
  try {
    const db = await connectDB();
    
    await db.execute(
      'INSERT INTO notification (id_utilisateur, type_notification, titre, contenu, lien) VALUES (?, ?, ?, ?, ?)',
      [userId, type, titre, contenu, lien || null]
    );
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    return { success: false, error: error.message };
  }
}
