'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Plus, Wrench, X, Save } from 'lucide-react';
import AppLayout from '../components/AppLayout';

const CATEGORIE_LABELS = {
  outil: 'Outil',
  engin: 'Engin',
  echafaudage: 'Échafaudage',
  protection: 'Protection',
  mesure: 'Mesure',
  autre: 'Autre',
};

const CATEGORIE_CLASSES = {
  outil: 'bg-blue-100 text-blue-700 border-blue-200',
  engin: 'bg-purple-100 text-purple-700 border-purple-200',
  echafaudage: 'bg-orange-100 text-orange-700 border-orange-200',
  protection: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  mesure: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  autre: 'bg-slate-100 text-slate-700 border-slate-200',
};

const ETAT_LABELS = {
  neuf: 'Neuf',
  bon: 'Bon état',
  usage: 'Usagé',
  a_reparer: 'À réparer',
  hors_service: 'Hors service',
};

const ETAT_CLASSES = {
  neuf: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  bon: 'bg-blue-100 text-blue-700 border-blue-200',
  usage: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  a_reparer: 'bg-orange-100 text-orange-700 border-orange-200',
  hors_service: 'bg-red-100 text-red-700 border-red-200',
};

const CATEGORIES = Object.keys(CATEGORIE_LABELS);
const ETATS = Object.keys(ETAT_LABELS);

function EditModal({ item, onClose, onSaved }) {
  const [values, setValues] = useState({
    nom: item.nom || '',
    categorie: item.categorie || 'outil',
    reference: item.reference || '',
    numero_serie: item.numero_serie || '',
    marque: item.marque || '',
    etat: item.etat || 'bon',
    date_achat: item.date_achat?.slice(0, 10) || '',
    prix_achat: item.prix_achat || '',
    date_prochaine_maintenance: item.date_prochaine_maintenance?.slice(0, 10) || '',
    localisation: item.localisation || '',
    notes: item.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.nom.trim()) { setError('Le nom est requis.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/materiel/${item.id_materiel}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors de la modification');
      onSaved();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${item.nom}" ?`)) return;
    try {
      const res = await fetch(`/api/materiel/${item.id_materiel}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors de la suppression');
      onSaved();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Modifier le matériel</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Nom *</span>
              <input value={values.nom} onChange={handleChange('nom')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" required />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Catégorie</span>
              <select value={values.categorie} onChange={handleChange('categorie')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">État</span>
              <select value={values.etat} onChange={handleChange('etat')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
                {ETATS.map((e) => <option key={e} value={e}>{ETAT_LABELS[e]}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Localisation</span>
              <input value={values.localisation} onChange={handleChange('localisation')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Référence</span>
              <input value={values.reference} onChange={handleChange('reference')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Marque</span>
              <input value={values.marque} onChange={handleChange('marque')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
            </label>
          </div>
          <div className="flex items-center justify-between pt-2 gap-3">
            <button type="button" onClick={handleDelete} className="rounded-3xl border border-red-200 px-5 py-3 text-red-600 hover:bg-red-50 transition text-sm font-medium">
              Supprimer
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60">
              <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaterielPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [materiel, setMateriel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [etat, setEtat] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    fetchMateriel();
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      const delay = setTimeout(fetchMateriel, 250);
      return () => clearTimeout(delay);
    }
  }, [search, categorie, etat]);

  const fetchMateriel = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categorie) params.set('categorie', categorie);
      if (etat) params.set('etat', etat);
      const res = await fetch(`/api/materiel?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Impossible de charger le matériel');
      setMateriel(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Matériel</h1>
            <p className="mt-2 text-sm text-slate-600">Gérez l'inventaire de votre matériel et son affectation.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/materiel/nouveau')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter du matériel
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] mb-8">
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, référence ou marque"
              className="w-full border-0 outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="rounded-3xl bg-white px-5 py-3 shadow-sm border border-slate-200 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 shrink-0">Catégorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none">
              <option value="">Toutes</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="rounded-3xl bg-white px-5 py-3 shadow-sm border border-slate-200 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 shrink-0">État</label>
            <select value={etat} onChange={(e) => setEtat(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none">
              <option value="">Tous</option>
              {ETATS.map((e) => <option key={e} value={e}>{ETAT_LABELS[e]}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-5 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">Chargement du matériel...</div>
        ) : materiel.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 shadow-sm border border-slate-200 text-center text-slate-600">
            <Wrench className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="text-lg font-semibold">Aucun matériel</p>
            <p className="mt-2 text-sm text-slate-500">Ajoutez du matériel pour commencer l'inventaire.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {materiel.map((item) => (
              <button
                key={item.id_materiel}
                type="button"
                onClick={() => setSelected(item)}
                className="group text-left rounded-3xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.nom}</p>
                      {item.marque && <p className="text-xs text-slate-500">{item.marque}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${ETAT_CLASSES[item.etat] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {ETAT_LABELS[item.etat] || item.etat}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${CATEGORIE_CLASSES[item.categorie] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {CATEGORIE_LABELS[item.categorie] || item.categorie}
                  </span>
                  {item.reference && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      Réf. {item.reference}
                    </span>
                  )}
                  {item.localisation && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      📍 {item.localisation}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <EditModal
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); fetchMateriel(); }}
        />
      )}
    </AppLayout>
  );
}
