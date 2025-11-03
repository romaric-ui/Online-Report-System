// Test de connexion à la base de données en production
import { connectDB } from '../../../../lib/database.js';

export async function GET() {
  console.log('🔍 Test de connexion base de données...');
  
  try {
    const db = await connectDB();
    
    // Test simple
    const [test] = await db.execute('SELECT 1 as test, NOW() as timestamp');
    
    // Test de la table utilisateur
    let userTableInfo = null;
    try {
      const [columns] = await db.execute('DESCRIBE Utilisateur');
      userTableInfo = columns.map(col => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null,
        Key: col.Key
      }));
    } catch (tableError) {
      userTableInfo = `Erreur table: ${tableError.message}`;
    }

    return Response.json({
      success: true,
      message: '✅ Connexion réussie !',
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        testQuery: test[0],
        userTable: userTableInfo
      },
      variables: {
        AIVEN_HOST: process.env.AIVEN_HOST ? '✅ Défini' : '❌ Manquant',
        AIVEN_PORT: process.env.AIVEN_PORT ? '✅ Défini' : '❌ Manquant',
        AIVEN_USER: process.env.AIVEN_USER ? '✅ Défini' : '❌ Manquant',
        AIVEN_PASSWORD: process.env.AIVEN_PASSWORD ? '✅ Défini' : '❌ Manquant',
        AIVEN_DATABASE: process.env.AIVEN_DATABASE ? '✅ Défini' : '❌ Manquant',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Défini' : '❌ Manquant',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Défini' : '❌ Manquant'
      }
    });

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);

    return Response.json({
      success: false,
      error: error.message,
      code: error.code,
      errno: error.errno,
      environment: process.env.NODE_ENV,
      variables: {
        AIVEN_HOST: process.env.AIVEN_HOST ? '✅ Défini' : '❌ Manquant',
        AIVEN_PORT: process.env.AIVEN_PORT ? '✅ Défini' : '❌ Manquant',
        AIVEN_USER: process.env.AIVEN_USER ? '✅ Défini' : '❌ Manquant',
        AIVEN_PASSWORD: process.env.AIVEN_PASSWORD ? '✅ Défini' : '❌ Manquant',
        AIVEN_DATABASE: process.env.AIVEN_DATABASE ? '✅ Défini' : '❌ Manquant',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Défini' : '❌ Manquant',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Défini' : '❌ Manquant'
      },
      suggestions: [
        'Vérifiez que les variables AIVEN_* sont définies dans Netlify',
        'Vérifiez que le service Aiven est actif',
        'Vérifiez les paramètres SSL',
        'Consultez les logs Netlify Functions'
      ]
    }, { status: 500 });
  }
}