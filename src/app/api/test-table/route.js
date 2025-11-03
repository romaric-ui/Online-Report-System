// Test final de la table Utilisateur
export async function GET() {
  try {
    const { connectDB } = await import('../../../lib/database.js');
    const db = await connectDB();
    
    // Test si la table Utilisateur existe et sa structure
    try {
      const [tableInfo] = await db.execute('DESCRIBE Utilisateur');
      const [tableData] = await db.execute('SELECT COUNT(*) as count FROM Utilisateur');
      
      return Response.json({
        success: true,
        message: '✅ Table Utilisateur opérationnelle !',
        table: {
          structure: tableInfo,
          count: tableData[0].count,
          exists: true
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return Response.json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erreur de connexion: ' + error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}