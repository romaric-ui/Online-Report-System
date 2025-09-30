import { updateReport, deleteReport } from '../../../../../lib/database.js';
import { validateReportData, validateId } from '../../../../../lib/security.js';

export async function PUT(request, { params }) {
  try {
    // Validation de l'ID
    const idValidation = validateId(params.id, 'ID du rapport');
    if (!idValidation.isValid) {
      return Response.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }
    
    const reportData = await request.json();
    
    // Validation et nettoyage des données du rapport
    const validation = validateReportData(reportData);
    if (!validation.isValid) {
      return Response.json(
        { error: `Données invalides: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }
    
    const result = await updateReport(idValidation.value, validation.cleanData);
    
    if (result.affectedRows === 0) {
      return Response.json(
        { error: 'Rapport non trouvé' }, 
        { status: 404 }
      );
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Erreur lors de la mise à jour du rapport' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Validation de l'ID
    const idValidation = validateId(params.id, 'ID du rapport');
    if (!idValidation.isValid) {
      return Response.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }
    
    const result = await deleteReport(idValidation.value);
    
    if (result.affectedRows === 0) {
      return Response.json(
        { error: 'Rapport non trouvé' }, 
        { status: 404 }
      );
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Erreur lors de la suppression du rapport' }, 
      { status: 500 }
    );
  }
}