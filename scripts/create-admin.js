// scripts/create-admin.js
// Script pour créer un utilisateur administrateur
// Usage : node scripts/create-admin.js
// Lit ADMIN_PASSWORD (obligatoire, 12 caractères minimum) et ADMIN_EMAIL (facultatif) dans .env.local

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'onlinereports',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function createAdmin() {
  const motDePasse = process.env.ADMIN_PASSWORD;
  if (!motDePasse || motDePasse.length < 12) {
    throw new Error('Définissez ADMIN_PASSWORD (12 caractères minimum) dans .env.local avant de lancer le script.');
  }

  let connection;

  try {
    console.log('📡 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);

    // Données de l'admin
    const adminData = {
      nom: 'SGTEC',
      prenom: 'Administrateur',
      email: process.env.ADMIN_EMAIL || 'admin@sgtec.com',
      mot_de_passe: motDePasse,
      id_role: 1 // Role Administrateur
    };

    // Hasher le mot de passe avec un salt fort (12 rounds)
    const hashedPassword = await bcrypt.hash(adminData.mot_de_passe, 12);

    // Vérifier si l'admin existe déjà
    const [existing] = await connection.execute(
      'SELECT id_utilisateur FROM Utilisateur WHERE email = ?',
      [adminData.email]
    );

    if (existing.length > 0) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà');
      console.log('🔄 Mise à jour du mot de passe et du rôle...');

      await connection.execute(
        'UPDATE Utilisateur SET mot_de_passe = ?, id_role = ? WHERE email = ?',
        [hashedPassword, adminData.id_role, adminData.email]
      );

      console.log('✅ Mot de passe et rôle mis à jour avec succès !');
    } else {
      console.log('👤 Création de l\'utilisateur administrateur...');

      await connection.execute(`
        INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, id_role, provider, email_verified, statut)
        VALUES (?, ?, ?, ?, ?, 'credentials', 1, 'actif')
      `, [
        adminData.nom,
        adminData.prenom,
        adminData.email,
        hashedPassword,
        adminData.id_role
      ]);

      console.log('✅ Administrateur créé avec succès !');
    }

    console.log('\n📋 Informations de connexion :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email      :', adminData.email);
    console.log('🔗 URL Admin  :', 'http://localhost:3000/admin/users');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Erreur:', error.message);

    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 Astuce : Exécutez d\'abord  node scripts/init-database.js');
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

createAdmin().catch(console.error);
