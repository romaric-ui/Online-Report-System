"use client";
import { FaTrash, FaEdit, FaFilePdf, FaFileDownload } from 'react-icons/fa';
import { useState } from 'react';

function timeAgo(iso){
  if(!iso) return '';
  const diff = Date.now()-new Date(iso).getTime();
  const s = Math.floor(diff/1000); if(s<60) return 'il y a quelques sec.';
  const m = Math.floor(s/60); if(m<60) return `il y a ${m} min`;
  const h = Math.floor(m/60); if(h<24) return `il y a ${h} h`;
  const d = Math.floor(h/24); if(d<7) return `il y a ${d} j`;
  const w = Math.floor(d/7); if(w<5) return `il y a ${w} sem.`;
  const mo = Math.floor(d/30); if(mo<12) return `il y a ${mo} mois`;
  const y = Math.floor(d/365); return `il y a ${y} an${y>1?'s':''}`;
}

export default function ReportTable({ reports, onDelete, onUpdate, onEditReport, onOpenPdf }) {
  const [confirmId, setConfirmId] = useState(null);

  const handleStatusChange = (r, value) => {
    onUpdate({ ...r, status: value, updatedAt: new Date().toISOString() });
  };

  if(!reports.length){
    return <div className="p-4 bg-white rounded-lg border text-sm text-gray-500">Aucun rapport.</div>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
            <th className="px-3 py-2 text-left">Propriétaire / Entreprise</th>
            <th className="px-3 py-2 text-left">Phase</th>
            <th className="px-3 py-2 text-left">Statut</th>
            <th className="px-3 py-2 text-left">Créé</th>
            <th className="px-3 py-2 text-left">Maj</th>
            <th className="px-3 py-2 text-left">PDF</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r,i)=>{
            const hasPdf = !!r.pdfDataUrl;
            const fileName = (() => {
              const base = (r.proprietaire || r.entreprise || 'rapport').toString().trim().replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'');
              const date = r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
              return `${base || 'rapport'}_${date}.pdf`;
            })();
            return (
              <tr key={r.id} className={i%2===0?'bg-white':'bg-gray-50'}>
                <td className="px-3 py-2 align-top">
                  <div className="font-semibold text-gray-800 text-[0.8rem]">{r.proprietaire || r.entreprise || '—'}</div>
                  <div className="text-[0.65rem] text-gray-500 truncate max-w-[180px]">{r.entreprise}</div>
                </td>
                <td className="px-3 py-2 align-top">
                  {r.phase && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">{r.phase}</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    value={r.status || ''}
                    onChange={(e)=>handleStatusChange(r, e.target.value)}
                    className="text-[10px] px-2 py-1 rounded border bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="En cours">En cours</option>
                    <option value="En attente">En attente</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </td>
                <td className="px-3 py-2 align-top text-[0.65rem] text-gray-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                <td className="px-3 py-2 align-top text-[0.65rem] text-gray-500">{r.updatedAt && timeAgo(r.updatedAt)}</td>
                <td className="px-3 py-2 align-top">
                  {hasPdf ? (
                    <div className="flex items-center gap-2">
                      <button onClick={()=>onOpenPdf(r)} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700" title="Ouvrir panneau PDF">
                        <FaFilePdf className="text-xs" /> Ouvrir
                      </button>
                      <a
                        href={r.pdfDataUrl}
                        download={fileName}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                        title={`Télécharger (${fileName})`}
                      >
                        <FaFileDownload className="text-xs" />
                        <span>Télécharger</span>
                      </a>
                    </div>
                  ) : (
                    <button onClick={()=>onOpenPdf(r)} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" title="Générer le PDF">
                      <FaFilePdf className="text-xs" /> Générer
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>onEditReport(r)} className="p-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700" title="Éditer">
                      <FaEdit className="text-xs" />
                    </button>
                    {confirmId===r.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={()=>{onDelete(r.id); setConfirmId(null);}} className="px-2 py-1 text-[10px] bg-red-600 text-white rounded">Oui</button>
                        <button onClick={()=>setConfirmId(null)} className="px-2 py-1 text-[10px] bg-gray-200 rounded">Non</button>
                      </div>
                    ) : (
                      <button onClick={()=>setConfirmId(r.id)} className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600" title="Supprimer">
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
