// API de test simple pour l'inscription
export async function POST(request) {
  try {
    console.log('🧪 API register appelée');
    const body = await request.json();
    console.log('Données reçues:', body);
    
    return Response.json({ 
      success: true, 
      message: 'Test API fonctionnel',
      received: body 
    });
  } catch (error) {
    console.error('Erreur dans API register:', error);
    return Response.json(
      { error: 'Erreur test: ' + error.message },
      { status: 500 }
    );
  }
}