// API pour créer une notification
import { connectDB } from './database.js';

export async function createNotification({ userId, type, titre, message }) {
  try {
    const db = await connectDB();
    
    await db.execute(
      'INSERT INTO Notification (id_utilisateur, type_notification, titre, contenu) VALUES (?, ?, ?, ?)',
      [userId, type || 'systeme', titre, message || null]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Erreur création notification:', error);
    return { success: false, error: error.message };
  }
}
