import { getAllReports, createReport } from '../../../../lib/database.js';
import { validateReportData } from '../../../../lib/security.js';

export async function GET() {
  try {
    const reports = await getAllReports();
    return Response.json(reports);
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Erreur lors de la récupération des rapports' }, 
      { status: 500 }
    );
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