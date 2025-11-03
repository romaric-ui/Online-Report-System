// Test de la structure de la table Role
export async function GET() {
  try {
    const { connectDB } = await import('../../../../lib/database.js');
    const db = await connectDB();
    
    // Test structure de la table Role
    try {
      const [roleStructure] = await db.execute('DESCRIBE Role');
      const [roleData] = await db.execute('SELECT * FROM Role');
      
      return Response.json({
        success: true,
        message: '✅ Table Role analysée !',
        structure: roleStructure,
        data: roleData,
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