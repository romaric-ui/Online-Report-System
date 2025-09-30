// Script pour créer un utilisateur de test
import { connectDB } from '../lib/database.js';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  console.log('👤 Création d\'un utilisateur de test...');
  
  try {
    const db = await connectDB();

    // Vérifier si l'utilisateur de test existe déjà
    const [existingUser] = await db.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ?',
      ['test@example.com']
    );

    if (existingUser.length > 0) {
      console.log('ℹ️  L\'utilisateur de test existe déjà');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Mot de passe: test123');
      await db.end();
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('test123', 12);

    // Créer l'utilisateur de test
    const [result] = await db.execute(
      `INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Test', 'User', 'test@example.com', hashedPassword, 2]
    );

    console.log('✅ Utilisateur de test créé avec succès !');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Mot de passe: test123');
    console.log('👤 ID utilisateur:', result.insertId);

    await db.end();
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
  }
}

// Exécuter la création
createTestUser();