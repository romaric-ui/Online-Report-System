'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, CalendarDays, CloudSnow, Sun, Cloud, CloudRain, Zap, FileText, User } from 'lucide-react';

const METEO_OPTIONS = [
  { value: 'ensoleille', label: 'Ensoleillé', emoji: '☀️' },
  { value: 'nuageux', label: 'Nuageux', emoji: '☁️' },
  { value: 'pluie', label: 'Pluie', emoji: '🌧️' },
  { value: 'orage', label: 'Orage', emoji: '⛈️' },
  { value: 'vent_fort', label: 'Vent fort', emoji: '💨' },
];

export default function ChantierJournalPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date_journal: new Date().toISOString().slice(0, 10),
    meteo: 'ensoleille',
    resume: '',
    travaux_realises: '',
    problemes: '',
    decisions: '',
    observations: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      loadJournals();
    }
  }, [status, id]);

  const loadJournals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/journal`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Impossible de charger le journal');
      }
      setJournals(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Erreur lors de l’ajout du journal');
      }
      setForm((prev) => ({ ...prev, resume: '', travaux_realises: '', problemes: '', decisions: '', observations: '' }));
      loadJournals();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Journal de chantier</h1>
            <p className="mt-2 text-slate-500">Consultez et ajoutez des entrées quotidiennes pour le chantier.</p>
          </div>
          <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <Plus className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Nouvelle entrée</h2>
              <p className="text-sm text-slate-500">Ajoutez un rapport quotidien pour le chantier.</p>
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Date</span>
                <input type="date" value={form.date_journal} onChange={handleChange('date_journal')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Météo</span>
                <select value={form.meteo} onChange={handleChange('meteo')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
                  {METEO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Résumé</span>
                <input value={form.resume} onChange={handleChange('resume')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Travaux réalisés</span>
                <textarea value={form.travaux_realises} onChange={handleChange('travaux_realises')} rows={3} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Problèmes</span>
                <textarea value={form.problemes} onChange={handleChange('problemes')} rows={3} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Décisions</span>
                <textarea value={form.decisions} onChange={handleChange('decisions')} rows={3} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Observations</span>
                <textarea value={form.observations} onChange={handleChange('observations')} rows={3} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="rounded-3xl border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-100 transition">Annuler</button>
              <button type="submit" disabled={saving} className="rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2 justify-center">
                <Plus className="w-4 h-4" /> {saving ? 'Ajout...' : 'Nouvelle entrée'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-3xl bg-slate-100 p-3 text-slate-700 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Entrées du journal</h2>
              <p className="text-sm text-slate-500">Dernières entrées classées par date.</p>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-600">Chargement des journaux...</p>
          ) : journals.length === 0 ? (
            <p className="text-slate-600">Aucune entrée journal pour le moment.</p>
          ) : (
            <div className="space-y-6">
              {journals.map((journal) => {
                const option = METEO_OPTIONS.find((item) => item.value === journal.meteo);
                return (
                  <div key={journal.id_journal} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{journal.date_journal}</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">{option?.emoji || '📝'} {option?.label || journal.meteo}</h3>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200">
                        <User className="w-4 h-4" />
                        {journal.redacteur_prenom || 'Utilisateur'} {journal.redacteur_nom || ''}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Résumé</p>
                        <p className="mt-2 text-slate-600 whitespace-pre-line">{journal.resume || 'Aucun résumé.'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Travaux réalisés</p>
                        <p className="mt-2 text-slate-600 whitespace-pre-line">{journal.travaux_realises || 'Aucun renseignement.'}</p>
                      </div>
                    </div>
                    {(journal.problemes || journal.decisions || journal.observations) && (
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Problèmes</p>
                          <p className="mt-2 text-slate-600 whitespace-pre-line">{journal.problemes || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Décisions</p>
                          <p className="mt-2 text-slate-600 whitespace-pre-line">{journal.decisions || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Observations</p>
                          <p className="mt-2 text-slate-600 whitespace-pre-line">{journal.observations || '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
