const mysql = require('mysql2/promise');

async function checkLocalStructure() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'onlinereports',
      port: 3306,
    });

    console.log('✅ Connexion locale réussie');

    // Vérifier la structure de la table utilisateur
    const [userColumns] = await connection.execute('DESCRIBE utilisateur');
    console.log('\n📋 Structure table utilisateur (LOCALE):');
    userColumns.forEach(col => console.log(`  ${col.Field} (${col.Type})`));

    // Vérifier la structure de la table rapport
    const [reportColumns] = await connection.execute('DESCRIBE rapport');
    console.log('\n📋 Structure table rapport (LOCALE):');
    reportColumns.forEach(col => console.log(`  ${col.Field} (${col.Type})`));

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkLocalStructure();