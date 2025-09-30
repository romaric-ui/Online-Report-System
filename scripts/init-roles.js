// Script d'initialisation des rôles par défaut
import { connectDB } from '../lib/database.js';

async function initializeRoles() {
  console.log('🔧 Initialisation des rôles par défaut...');
  
  try {
    const db = await connectDB();

    // Vérifier si les rôles existent déjà
    const [existingRoles] = await db.execute('SELECT COUNT(*) as count FROM Role');
    
    if (existingRoles[0].count === 0) {
      console.log('📝 Création des rôles par défaut...');
      
      // Créer les rôles par défaut
      await db.execute(`
        INSERT INTO Role (id_role, nom_role, description) VALUES 
        (1, 'Administrateur', 'Accès complet au système'),
        (2, 'Utilisateur', 'Accès standard pour créer et gérer ses rapports')
      `);
      
      console.log('✅ Rôles créés avec succès !');
    } else {
      console.log('ℹ️  Les rôles existent déjà');
    }

    // Vérifier la structure de la table Role
    console.log('\n🏗️ Structure de la table Role:');
    const [roleStructure] = await db.execute('DESCRIBE Role');
    roleStructure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Vérifier la structure de la table Utilisateur
    console.log('\n🏗️ Structure de la table Utilisateur:');
    const [userStructure] = await db.execute('DESCRIBE Utilisateur');
    userStructure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Afficher les rôles existants
    const [roles] = await db.execute('SELECT * FROM Role');
    console.log('\n📋 Rôles disponibles:');
    console.log('Données brutes:', roles);
    roles.forEach(role => {
      console.log(`  - ID: ${role.id_role}, Libellé: ${role.libelle}`);
    });

    await db.end();
    console.log('\n🎉 Initialisation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n⚠️  La table Role n\'existe pas. Vérifiez votre base de données.');
    }
  }
}

// Exécuter l'initialisation
initializeRoles();