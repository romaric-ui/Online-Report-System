// components/ReportCard.jsx
// -----------------------------------------------------------------------------
// Carte d'affichage d'un rapport.
// Rôles :
//  - Afficher les métadonnées principales (propriétaire / entreprise / date / statut)
//  - Permettre le changement cyclique de statut (En cours -> En attente -> Terminé)
//  - Proposer la suppression avec confirmation
//  - Afficher les pièces jointes (thumbnails)
//  - Intégrer le générateur de PDF (PdfGenerator) avec sauvegarde du PDF dans le report
// -----------------------------------------------------------------------------
"use client";
import { FaTrash, FaEdit, FaFilePdf } from "react-icons/fa";
import { useState, useEffect } from 'react';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff/1000);
  if (s < 60) return 'il y a quelques secondes';
  const m = Math.floor(s/60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m/60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h/24);
  if (d < 7) return `il y a ${d} j`;
  const w = Math.floor(d/7);
  if (w < 5) return `il y a ${w} sem.`;
  const mo = Math.floor(d/30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.floor(d/365);
  return `il y a ${y} an${y>1?'s':''}`;
}

export default function ReportCard({ report, onDelete, onUpdate, onEditReport, onOpenPdf }) {
  const [askDelete, setAskDelete] = useState(false);
  const [pdfJustUpdated, setPdfJustUpdated] = useState(false);

  // Détecte l'ajout ou la mise à jour du PDF pour activer une animation temporaire
  useEffect(() => {
    if (report.pdfDataUrl) {
      setPdfJustUpdated(true);
      const t = setTimeout(() => setPdfJustUpdated(false), 4500);
      return () => clearTimeout(t);
    }
  }, [report.pdfDataUrl]);
  // toggleStatus : fait tourner le statut parmi 3 valeurs prédéfinies.
  // On met aussi à jour 'updatedAt' pour signaler un changement (utile pour invalidation cache PDF / logo).
  const toggleStatus = () => {
    let next;
    if (report.status === 'En cours') next = 'En attente';
    else if (report.status === 'En attente') next = 'Terminé';
    else next = 'En cours';
    if (onUpdate) onUpdate({ ...report, status: next, updatedAt: new Date().toISOString() });
  };

  return (
    <>
    {/* Conteneur principal de la carte */}
    <div className={`relative bg-white p-6 md:p-8 rounded-2xl shadow-lg border flex flex-col gap-4 animate-fade-in-up will-change-transform transition-shadow ${pdfJustUpdated ? 'border-blue-400 shadow-blue-200 ring-2 ring-blue-300 ring-offset-0' : 'border-gray-100'}`}>        
      {report.pdfDataUrl && (
        <div className="absolute -top-3 -right-3 flex items-center gap-1 bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-md animate-pulse">
          <FaFilePdf className="text-xs" />
          <span>PDF</span>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          {/* Titre : priorité d'affichage propriétaire > entreprise > adresse > fallback */}
          <h2 className="font-bold text-lg">{report.proprietaire || report.entreprise || report.adresseOuvrage || 'Rapport'}</h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
            <span>Entreprise : {report.entreprise || '-'}</span>
            {report.phase && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 text-indigo-700 tracking-wide uppercase">
                {report.phase}
              </span>
            )}
          </p>
          <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
            <span className="mr-2">Statut: <strong>{report.status}</strong></span>
            <span>Créé: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '-'}</span>
            {report.updatedAt && (
              <span className="ml-2 text-[11px] text-gray-400">Maj {timeAgo(report.updatedAt)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton changement de statut (icône crayon recyclée) */}
          <button
            onClick={toggleStatus}
            className="text-yellow-600 hover:text-yellow-800 p-2"
            title="Basculer statut"
          >
            <FaEdit />
          </button>
          {/* Bouton suppression avec confirmation */}
          {!askDelete && (
            <button
              onClick={() => setAskDelete(true)}
              className="text-red-500 hover:text-red-700 p-2"
              title="Supprimer le rapport"
            >
              <FaTrash />
            </button>
          )}
          {askDelete && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(); setAskDelete(false); }}
                className="text-white bg-red-600 hover:bg-red-700 text-[10px] px-2 py-1 rounded"
              >Confirmer</button>
              <button
                onClick={() => setAskDelete(false)}
                className="text-[10px] px-2 py-1 rounded bg-gray-200 text-gray-700"
              >Annuler</button>
            </div>
          )}
        </div>
      </div>

      {/* Localisation retirée */}

      {/* Attachments thumbnails */}
      {report.attachments && report.attachments.length > 0 && (
        // Affiche chaque pièce jointe : image + légende (caption) si fournie
        <div className="mt-3 grid grid-cols-3 gap-2">
          {report.attachments.map(att => (
            <div key={att.id} className="card">
              <img src={att.dataUrl} alt={att.caption || 'attachment'} className="w-full h-24 object-cover rounded" />
              {att.caption && <div className="text-xs mt-1">{att.caption}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-between items-center">
        <button
          type="button"
          onClick={() => onEditReport(report)}
          className="text-xs px-3 py-1.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
        >Éditer</button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenPdf && onOpenPdf(report)}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 shadow"
          >PDF</button>
        </div>
      </div>
    </div>
    </>
  );
}
