// scripts/create-admin.js
// Script pour créer un utilisateur administrateur

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'onlinereports',
  port: 3306
};

async function createAdmin() {
  let connection;
  
  try {
    console.log('📡 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // Données de l'admin
    const adminData = {
      nom: 'SGTEC',
      prenom: 'Administrateur',
      email: 'admin@sgtec.com',
      mot_de_passe: 'Admin@123', // Mot de passe par défaut
      id_role: 1 // Role admin
    };
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(adminData.mot_de_passe, 10);
    
    // Vérifier si l'admin existe déjà
    const [existing] = await connection.execute(
      'SELECT id_utilisateur FROM utilisateur WHERE email = ?',
      [adminData.email]
    );
    
    if (existing.length > 0) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà');
      console.log('📧 Email:', adminData.email);
      console.log('🔄 Mise à jour du mot de passe et du rôle...');
      
      await connection.execute(
        'UPDATE utilisateur SET mot_de_passe = ?, id_role = ? WHERE email = ?',
        [hashedPassword, adminData.id_role, adminData.email]
      );
      
      console.log('✅ Mot de passe et rôle mis à jour avec succès !');
    } else {
      console.log('👤 Création de l\'utilisateur administrateur...');
      
      await connection.execute(`
        INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, id_role, provider, email_verified)
        VALUES (?, ?, ?, ?, ?, 'credentials', 1)
      `, [
        adminData.nom,
        adminData.prenom,
        adminData.email,
        hashedPassword,
        adminData.id_role
      ]);
      
      console.log('✅ Administrateur créé avec succès !');
    }
    
    console.log('\n📋 Informations de connexion:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Mot de passe:', adminData.mot_de_passe);
    console.log('🔗 URL Admin:', 'http://localhost:3000/admin/users');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
createAdmin().catch(console.error);
