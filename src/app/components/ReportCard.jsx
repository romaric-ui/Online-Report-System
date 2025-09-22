// components/ReportCard.jsx
"use client";
import PdfGenerator from "./PdfGenerator";
import { FaTrash, FaEdit } from "react-icons/fa";

export default function ReportCard({ report, onDelete, onUpdate, onEditReport }) {
  const toggleStatus = () => {
    let next;
    if (report.status === 'En cours') next = 'En attente';
    else if (report.status === 'En attente') next = 'Terminé';
    else next = 'En cours';
    if (onUpdate) onUpdate({ ...report, status: next, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-bold text-lg">{report.proprietaire || report.entreprise || report.adresseOuvrage || 'Rapport'}</h2>
          <p className="text-sm text-gray-600">Entreprise : {report.entreprise}</p>
          <div className="text-xs text-gray-500 mt-1">
            <span className="mr-2">Statut: <strong>{report.status}</strong></span>
            <span>Créé: {report.createdAt ? new Date(report.createdAt).toLocaleString() : '-'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleStatus}
            className="text-yellow-600 hover:text-yellow-800 p-2"
            title="Basculer statut"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment supprimer ce rapport ?')) {
                onDelete();
              }
            }}
            className="text-red-500 hover:text-red-700 p-2"
            title="Supprimer le rapport"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Localisation retirée */}

      {/* Attachments thumbnails */}
      {report.attachments && report.attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {report.attachments.map(att => (
            <div key={att.id} className="card">
              <img src={att.dataUrl} alt={att.caption || 'attachment'} className="w-full h-24 object-cover rounded" />
              {att.caption && <div className="text-xs mt-1">{att.caption}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <PdfGenerator 
          report={report} 
          onSavePdf={(dataUrl) => onUpdate({ ...report, pdfDataUrl: dataUrl, updatedAt: new Date().toISOString() })}
          onEditReport={onEditReport}
        />
      </div>
    </div>
  );
}
