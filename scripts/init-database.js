// Script d'initialisation de la base de données avec les rôles par défaut
import { connectDB } from '../lib/database.js';

async function initializeDatabase() {
  console.log('🔧 Initialisation de la base de données...');
  
  try {
    const db = await connectDB();

    // Vérifier si les rôles existent
    const [roles] = await db.execute('SELECT COUNT(*) as count FROM Role');
    
    if (roles[0].count === 0) {
      console.log('📝 Création des rôles par défaut...');
      
      // Créer les rôles par défaut
      await db.execute(`
        INSERT INTO Role (nom_role, description) VALUES 
        ('Administrateur', 'Accès complet au système'),
        ('Utilisateur', 'Accès standard pour créer et gérer ses rapports')
      `);
      
      console.log('✅ Rôles créés : Administrateur, Utilisateur');
    } else {
      console.log('✅ Rôles déjà présents dans la base');
    }

    // Vérifier les utilisateurs existants
    const [users] = await db.execute('SELECT COUNT(*) as count FROM Utilisateur');
    console.log(`📊 Utilisateurs existants: ${users[0].count}`);

    // Vérifier les rapports existants
    const [reports] = await db.execute('SELECT COUNT(*) as count FROM Rapport');
    console.log(`📊 Rapports existants: ${reports[0].count}`);

    await db.end();
    console.log('🎉 Initialisation terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

// Exécuter l'initialisation
initializeDatabase();