'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, PackagePlus, PackageMinus, Wrench } from 'lucide-react';

const ETAT_LABELS = {
  neuf: 'Neuf',
  bon: 'Bon état',
  usage: 'Usagé',
  a_reparer: 'À réparer',
  hors_service: 'Hors service',
};

const CATEGORIE_LABELS = {
  outil: 'Outil',
  engin: 'Engin',
  echafaudage: 'Échafaudage',
  protection: 'Protection',
  mesure: 'Mesure',
  autre: 'Autre',
};

function RetourModal({ item, onClose, onSaved, chantierId }) {
  const [values, setValues] = useState({
    date_retour: new Date().toISOString().slice(0, 10),
    etat_retour: 'bon',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${chantierId}/materiel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_affectation: item.id_affectation, ...values }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors du retour');
      onSaved();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Retour du matériel</h2>
        <p className="text-sm text-slate-500 mb-6">{item.nom}</p>
        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Date de retour</span>
            <input type="date" value={values.date_retour} onChange={(e) => setValues((p) => ({ ...p, date_retour: e.target.value }))} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">État au retour</span>
            <select value={values.etat_retour} onChange={(e) => setValues((p) => ({ ...p, etat_retour: e.target.value }))} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
              {Object.entries(ETAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-3xl border border-slate-200 px-5 py-3 text-slate-700 hover:bg-slate-100 transition">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Confirmer le retour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChantierMaterielPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [affectations, setAffectations] = useState([]);
  const [disponible, setDisponible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retourItem, setRetourItem] = useState(null);

  const [form, setForm] = useState({
    id_materiel: '',
    date_sortie: new Date().toISOString().slice(0, 10),
    date_retour_prevue: '',
    etat_sortie: 'bon',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetchAffectations();
      fetchDisponible();
    }
  }, [status, id]);

  const fetchAffectations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/materiel`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Impossible de charger le matériel');
      setAffectations(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponible = async () => {
    try {
      const res = await fetch('/api/materiel?etat=neuf&limit=200');
      // On fetch tout le disponible via l'endpoint dédié — utilise findDisponible via le param
      const res2 = await fetch('/api/materiel?limit=200');
      const json = await res2.json();
      if (res2.ok && json.success) setDisponible(json.data || []);
    } catch {
      // non-bloquant
    }
  };

  const handleFormChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAffecter = async (e) => {
    e.preventDefault();
    if (!form.id_materiel) { setError('Sélectionnez du matériel.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/materiel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Erreur lors de l'affectation");
      setForm({ id_materiel: '', date_sortie: new Date().toISOString().slice(0, 10), date_retour_prevue: '', etat_sortie: 'bon' });
      fetchAffectations();
      fetchDisponible();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const affectesIds = new Set(affectations.map((a) => a.id_materiel));
  const materielDisponible = disponible.filter((m) => !affectesIds.has(m.id_materiel) && m.etat !== 'hors_service');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Matériel du chantier</h1>
            <p className="mt-2 text-slate-500">Gérez le matériel affecté à ce chantier.</p>
          </div>
          <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

        {/* Formulaire d'affectation */}
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Affecter du matériel</h2>
              <p className="text-sm text-slate-500">Assignez du matériel disponible à ce chantier.</p>
            </div>
          </div>
          <form onSubmit={handleAffecter} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">Matériel *</span>
              <select value={form.id_materiel} onChange={handleFormChange('id_materiel')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" required>
                <option value="">— Sélectionner —</option>
                {materielDisponible.map((m) => (
                  <option key={m.id_materiel} value={m.id_materiel}>
                    {m.nom}{m.marque ? ` — ${m.marque}` : ''}{m.reference ? ` (${m.reference})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Date de sortie *</span>
              <input type="date" value={form.date_sortie} onChange={handleFormChange('date_sortie')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Retour prévu</span>
              <input type="date" value={form.date_retour_prevue} onChange={handleFormChange('date_retour_prevue')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
            </label>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60">
                <PackagePlus className="w-4 h-4" />{saving ? 'Affectation...' : 'Affecter'}
              </button>
            </div>
          </form>
        </div>

        {/* Liste du matériel affecté */}
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-3xl bg-emerald-500 p-3 text-white shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Matériel sur site</h2>
              <p className="text-sm text-slate-500">{affectations.length} équipement{affectations.length !== 1 ? 's' : ''} affecté{affectations.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-600">Chargement...</p>
          ) : affectations.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">
              <Wrench className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="font-medium">Aucun matériel affecté à ce chantier.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {affectations.map((item) => (
                <div key={item.id_affectation} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.nom}</p>
                      <p className="text-sm text-slate-500">
                        {CATEGORIE_LABELS[item.categorie] || item.categorie}
                        {' · '}Sorti le {item.date_sortie?.slice(0, 10) || '—'}
                        {item.date_retour_prevue ? ` · Retour prévu ${item.date_retour_prevue.slice(0, 10)}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRetourItem(item)}
                    className="inline-flex items-center gap-2 rounded-3xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                  >
                    <PackageMinus className="w-4 h-4" />
                    Retourner
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {retourItem && (
        <RetourModal
          item={retourItem}
          chantierId={id}
          onClose={() => setRetourItem(null)}
          onSaved={() => { setRetourItem(null); fetchAffectations(); fetchDisponible(); }}
        />
      )}
    </div>
  );
}
