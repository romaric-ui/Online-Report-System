'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, Clock } from 'lucide-react';

const STATUT_LABELS = {
  present: 'Présent',
  absent: 'Absent',
  retard: 'Retard',
  conge: 'Congé',
};

const STATUT_CLASSES = {
  present: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  absent: 'text-red-700 bg-red-50 border-red-200',
  retard: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  conge: 'text-blue-700 bg-blue-50 border-blue-200',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function calcHeures(arrivee, depart) {
  if (!arrivee || !depart) return null;
  const [hA, mA] = arrivee.split(':').map(Number);
  const [hD, mD] = depart.split(':').map(Number);
  const total = (hD * 60 + mD) - (hA * 60 + mA);
  if (total <= 0) return null;
  return (total / 60).toFixed(2);
}

export default function ChantierPointagePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [date, setDate] = useState(todayISO());
  const [equipe, setEquipe] = useState([]);
  const [pointages, setPointages] = useState({});
  const [rows, setRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetchEquipe();
    }
  }, [status, id]);

  useEffect(() => {
    if (equipe.length > 0) fetchPointages();
  }, [date, equipe]);

  const fetchEquipe = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/equipe`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Impossible de charger l'équipe");
      setEquipe(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointages = async () => {
    try {
      const res = await fetch(`/api/chantiers/${id}/pointage?date=${date}`);
      const json = await res.json();
      if (!res.ok || !json.success) return;
      const map = {};
      const rowMap = {};
      for (const p of (json.data || [])) {
        map[p.id_ouvrier] = p;
        rowMap[p.id_ouvrier] = {
          heure_arrivee: p.heure_arrivee?.slice(0, 5) || '',
          heure_depart: p.heure_depart?.slice(0, 5) || '',
          statut: p.statut || 'present',
          note: p.note || '',
        };
      }
      setPointages(map);
      setRows((prev) => {
        // Initialiser seulement les ouvriers sans données locales
        const merged = { ...prev };
        for (const ouvrier of equipe) {
          const oid = ouvrier.id_ouvrier;
          if (!merged[oid]) {
            merged[oid] = rowMap[oid] || { heure_arrivee: '', heure_depart: '', statut: 'present', note: '' };
          } else if (rowMap[oid]) {
            merged[oid] = rowMap[oid];
          }
        }
        return merged;
      });
    } catch {
      // non-bloquant
    }
  };

  const getRow = (ouvrierId) => rows[ouvrierId] || { heure_arrivee: '', heure_depart: '', statut: 'present', note: '' };

  const handleRowChange = (ouvrierId, field) => (e) => {
    setRows((prev) => ({
      ...prev,
      [ouvrierId]: { ...getRow(ouvrierId), [field]: e.target.value },
    }));
    setSaved((prev) => ({ ...prev, [ouvrierId]: false }));
  };

  const handleSave = async (ouvrierId) => {
    setSaving((prev) => ({ ...prev, [ouvrierId]: true }));
    setError('');
    const row = getRow(ouvrierId);
    try {
      const res = await fetch(`/api/chantiers/${id}/pointage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_ouvrier: ouvrierId,
          date_pointage: date,
          heure_arrivee: row.heure_arrivee || null,
          heure_depart: row.heure_depart || null,
          statut: row.statut,
          note: row.note || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors de l\'enregistrement');
      setSaved((prev) => ({ ...prev, [ouvrierId]: true }));
      fetchPointages();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving((prev) => ({ ...prev, [ouvrierId]: false }));
    }
  };

  const totalHeures = useMemo(() => {
    return Object.values(pointages).reduce((sum, p) => sum + (parseFloat(p.heures_travaillees) || 0), 0);
  }, [pointages]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Pointage</h1>
            <p className="mt-2 text-slate-500">Enregistrez les présences et heures de travail.</p>
          </div>
          <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        {/* Sélecteur de date */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-sm font-medium text-slate-700 shrink-0">Date du pointage :</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 outline-none focus:border-indigo-500"
          />
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Total du jour : <span className="font-semibold text-slate-900">{totalHeures.toFixed(2)} h</span></span>
          </div>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">Chargement de l'équipe...</div>
        ) : equipe.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 shadow-sm border border-slate-200 text-center text-slate-600">
            <p className="font-medium">Aucun ouvrier affecté à ce chantier.</p>
            <button type="button" onClick={() => router.push(`/chantiers/${id}/equipe`)} className="mt-4 inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3 text-white font-semibold hover:bg-indigo-700 transition">
              Gérer l'équipe
            </button>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white shadow-xl border border-slate-200 overflow-hidden">
            {/* En-tête tableau */}
            <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1.2fr_1.5fr_2fr_auto] gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <span>Ouvrier</span>
              <span>Arrivée</span>
              <span>Départ</span>
              <span>Statut</span>
              <span>Note</span>
              <span></span>
            </div>

            <div className="divide-y divide-slate-100">
              {equipe.map((ouvrier) => {
                const row = getRow(ouvrier.id_ouvrier);
                const heures = calcHeures(row.heure_arrivee, row.heure_depart);
                const isSaving = saving[ouvrier.id_ouvrier];
                const isSaved = saved[ouvrier.id_ouvrier];

                return (
                  <div key={ouvrier.id_ouvrier} className="grid gap-4 lg:grid-cols-[2fr_1.2fr_1.2fr_1.5fr_2fr_auto] items-center px-6 py-5">
                    {/* Ouvrier */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                        {ouvrier.prenom?.charAt(0)}{ouvrier.nom?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{ouvrier.prenom} {ouvrier.nom}</p>
                        {ouvrier.poste && <p className="text-xs text-slate-500">{ouvrier.poste}</p>}
                        {heures && <p className="text-xs text-emerald-600 font-medium">{heures} h</p>}
                      </div>
                    </div>

                    {/* Heure arrivée */}
                    <div>
                      <label className="lg:hidden text-xs text-slate-500 mb-1 block">Arrivée</label>
                      <input
                        type="time"
                        value={row.heure_arrivee}
                        onChange={handleRowChange(ouvrier.id_ouvrier, 'heure_arrivee')}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Heure départ */}
                    <div>
                      <label className="lg:hidden text-xs text-slate-500 mb-1 block">Départ</label>
                      <input
                        type="time"
                        value={row.heure_depart}
                        onChange={handleRowChange(ouvrier.id_ouvrier, 'heure_depart')}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Statut */}
                    <div>
                      <label className="lg:hidden text-xs text-slate-500 mb-1 block">Statut</label>
                      <select
                        value={row.statut}
                        onChange={handleRowChange(ouvrier.id_ouvrier, 'statut')}
                        className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:border-indigo-500 ${STATUT_CLASSES[row.statut] || 'border-slate-200 bg-slate-50 text-slate-900'}`}
                      >
                        {Object.entries(STATUT_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Note */}
                    <div>
                      <label className="lg:hidden text-xs text-slate-500 mb-1 block">Note</label>
                      <input
                        type="text"
                        value={row.note}
                        onChange={handleRowChange(ouvrier.id_ouvrier, 'note')}
                        placeholder="Observation..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Bouton */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleSave(ouvrier.id_ouvrier)}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                          isSaved
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? '...' : isSaved ? 'Enregistré' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer total */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-sm font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              Total journée : <span className="text-slate-900">{totalHeures.toFixed(2)} heures travaillées</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
