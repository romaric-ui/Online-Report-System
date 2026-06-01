import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options.js';
import { successResponse, errorResponse } from '../../../../../lib/api-response.js';
import { connectDB } from '../../../../../lib/database.js';


const apiHandler = (handler) => async (request, context) => {
  try { return await handler(request, context); }
  catch (error) { return errorResponse(error, request); }
};

async function handleGET(request) {
  const chantierId = process.env.DEMO_CHANTIER_ID || '7';
  const db = await connectDB();

  const [[chantier], [taches], [equipe], [depenses], [incidents]] = await Promise.all([
    db.query(`SELECT * FROM Chantier WHERE id_chantier = ? LIMIT 1`, [chantierId]),
    db.query(`SELECT nom, statut, pourcentage, priorite, date_fin_prevue FROM Tache WHERE id_chantier = ? ORDER BY date_debut ASC`, [chantierId]),
    db.query(`SELECT o.nom, o.prenom, o.poste FROM Ouvrier o INNER JOIN AffectationChantier a ON o.id_ouvrier = a.id_ouvrier WHERE a.id_chantier = ?`, [chantierId]),
    db.query(`SELECT libelle, montant, categorie, date_depense, statut FROM Depense WHERE id_chantier = ? ORDER BY date_depense DESC LIMIT 5`, [chantierId]),
    db.query(`SELECT type_incident, gravite, statut, date_incident FROM IncidentSecurite WHERE id_chantier = ? ORDER BY date_incident DESC LIMIT 5`, [chantierId]),
  ]);

  return successResponse({
    chantier: chantier[0] || {},
    taches,
    equipe,
    depenses,
    incidents,
  });
}

export const GET = apiHandler(handleGET);