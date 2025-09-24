"use client";
import { useMemo } from 'react';

export default function StatsBar({ reports }) {
  const stats = useMemo(() => {
    const total = reports.length;
    const enCours = reports.filter(r => (r.status || '').toLowerCase() === 'en cours'.toLowerCase()).length;
    const termine = reports.filter(r => (r.status || '').toLowerCase() === 'terminé'.toLowerCase()).length;
    const attente = reports.filter(r => (r.status || '').toLowerCase() === 'en attente'.toLowerCase()).length;
    const progression = total === 0 ? 0 : Math.round((termine / total) * 100);

    // Phases distinctes
    const phases = Array.from(new Set(reports.map(r => r.phase).filter(Boolean)));

    return { total, enCours, termine, attente, progression, phasesCount: phases.length };
  }, [reports]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-2">
      <StatCard label="Total" value={stats.total} accent="bg-slate-100 text-slate-700" />
      <StatCard label="En cours" value={stats.enCours} accent="bg-blue-100 text-blue-700" />
      <StatCard label="Terminé" value={stats.termine} accent="bg-green-100 text-green-700" />
      <StatCard label="En attente" value={stats.attente} accent="bg-amber-100 text-amber-700" />
      <div className="p-3 bg-white rounded-lg shadow flex flex-col justify-between">
        <div className="text-xs font-medium text-gray-500 mb-1">Progression</div>
        <div className="flex items-end gap-2">
          <span className="text-lg font-semibold text-gray-800">{stats.progression}%</span>
          <div className="flex-1 h-2 rounded bg-gray-100 overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: stats.progression + '%' }} />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-gray-500">Phases: {stats.phasesCount}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`p-3 rounded-lg shadow flex flex-col bg-white relative overflow-hidden`}> 
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-800">{value}</div>
      <div className={`absolute inset-0 opacity-0 hover:opacity-100 transition-opacity ${accent} pointer-events-none mix-blend-multiply`} />
    </div>
  );
}
