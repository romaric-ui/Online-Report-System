// scripts/export-full-structure.js
// Script pour récupérer TOUTE la structure de la base locale

import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const localConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Ajustez si nécessaire
  database: 'onlinereports',
  port: 3306,
};

async function exportFullStructure() {
  let connection;
  
  try {
    console.log('🔗 Connexion à la base locale...');
    connection = await mysql.createConnection(localConfig);
    console.log('✅ Connecté à MySQL local');
    
    // 1. Lister toutes les tables
    console.log('📋 Récupération de toutes les tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 ${tables.length} tables trouvées:`);
    
    let sqlExport = '-- Export complet de la structure de base de données\n';
    sqlExport += '-- Date: ' + new Date().toISOString() + '\n\n';
    
    // 2. Pour chaque table, récupérer sa structure
    for (const tableRow of tables) {
      const tableName = tableRow[`Tables_in_onlinereports`];
      console.log(`🔍 Analyse de la table: ${tableName}`);
      
      // Récupérer la commande CREATE TABLE
      const [createResult] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
      const createSQL = createResult[0]['Create Table'];
      
      sqlExport += `-- Table: ${tableName}\n`;
      sqlExport += `DROP TABLE IF EXISTS ${tableName};\n`;
      sqlExport += createSQL + ';\n\n';
      
      // Récupérer quelques données d'exemple (les 5 premières lignes)
      try {
        const [data] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
        console.log(`   📊 ${data.length} lignes d'exemple récupérées`);
        
        if (data.length > 0) {
          // Générer des INSERT d'exemple
          const columns = Object.keys(data[0]);
          sqlExport += `-- Données d'exemple pour ${tableName}\n`;
          
          for (const row of data) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            });
            
            sqlExport += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          sqlExport += '\n';
        }
      } catch (error) {
        console.log(`   ⚠️ Impossible de récupérer les données: ${error.message}`);
      }
    }
    
    // 3. Sauvegarder dans un fichier
    await fs.writeFile('export-structure-complete.sql', sqlExport);
    console.log('💾 Structure exportée dans: export-structure-complete.sql');
    
    // 4. Afficher un résumé
    console.log('\n📋 RÉSUMÉ DES TABLES:');
    for (const tableRow of tables) {
      const tableName = tableRow[`Tables_in_onlinereports`];
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`   ${tableName}: ${count[0].count} lignes`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Vérifiez vos identifiants MySQL local');
      console.log('💡 Ou démarrez XAMPP/WAMP si nécessaire');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

exportFullStructure();