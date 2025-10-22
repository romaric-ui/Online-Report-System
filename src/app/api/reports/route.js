import { getAllReports, createReport } from '../../../../lib/database.js';
import { validateReportData } from '../../../../lib/security.js';

export async function GET() {
  try {
    console.log('📡 API: Récupération des rapports...');
    const reports = await getAllReports();
    console.log(`✅ API: ${reports.length} rapports récupérés avec succès`);
    return Response.json(reports);
  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Réponse gracieuse même en cas d'erreur
    return Response.json({
      success: false,
      message: 'Service temporairement indisponible',
      reports: [], // Tableau vide plutôt qu'une erreur
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 200 }); // 200 au lieu de 500 pour éviter les erreurs côté client
  }
}

export async function POST(request) {
  try {
    const reportData = await request.json();
    
    // Validation et nettoyage des données du rapport
    const validation = validateReportData(reportData);
    if (!validation.isValid) {
      return Response.json(
        { error: `Données invalides: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }
    
    const result = await createReport(validation.cleanData);
    return Response.json(
      { success: true, id: `rpt_${result.insertId}` }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Erreur lors de la création du rapport' }, 
      { status: 500 }
    );
  }
}