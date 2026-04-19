'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Plus, Users, Phone, Briefcase, X, Save } from 'lucide-react';
import AppLayout from '../components/AppLayout';

const STATUT_LABELS = {
  actif: 'Actif',
  inactif: 'Inactif',
  en_conge: 'En congé',
};

const STATUT_CLASSES = {
  actif: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactif: 'bg-slate-100 text-slate-700 border-slate-200',
  en_conge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const POSTES = [
  'Maçon', 'Électricien', 'Plombier', 'Peintre', 'Carreleur',
  'Charpentier', 'Ferronnier', 'Manœuvre', "Chef d'équipe",
  "Conducteur d'engins", 'Autre',
];

function EditModal({ ouvrier, onClose, onSaved }) {
  const [values, setValues] = useState({
    nom: ouvrier.nom || '',
    prenom: ouvrier.prenom || '',
    telephone: ouvrier.telephone || '',
    poste: ouvrier.poste || '',
    specialite: ouvrier.specialite || '',
    taux_horaire: ouvrier.taux_horaire || '',
    statut: ouvrier.statut || 'actif',
    date_embauche: ouvrier.date_embauche?.slice(0, 10) || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.nom.trim() || !values.prenom.trim()) {
      setError('Le nom et le prénom sont requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/ouvriers/${ouvrier.id_ouvrier}`, {
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
    if (!confirm(`Supprimer ${ouvrier.prenom} ${ouvrier.nom} ?`)) return;
    try {
      const res = await fetch(`/api/ouvriers/${ouvrier.id_ouvrier}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors de la suppression');
      onSaved();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Modifier l'ouvrier</h2>
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
              <span className="text-sm font-medium text-slate-700">Prénom *</span>
              <input value={values.prenom} onChange={handleChange('prenom')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" required />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Téléphone</span>
              <input type="tel" value={values.telephone} onChange={handleChange('telephone')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Poste</span>
              <select value={values.poste} onChange={handleChange('poste')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
                <option value="">— Sélectionner —</option>
                {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Statut</span>
              <select value={values.statut} onChange={handleChange('statut')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="en_conge">En congé</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Taux horaire (€)</span>
              <input type="number" step="0.01" value={values.taux_horaire} onChange={handleChange('taux_horaire')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
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

export default function EquipesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [ouvriers, setOuvriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    fetchOuvriers();
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      const delay = setTimeout(fetchOuvriers, 250);
      return () => clearTimeout(delay);
    }
  }, [search, statut]);

  const fetchOuvriers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statut) params.set('statut', statut);
      const res = await fetch(`/api/ouvriers?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Impossible de charger les ouvriers');
      setOuvriers(json.data || []);
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
            <h1 className="text-4xl font-bold text-slate-900">Équipes</h1>
            <p className="mt-2 text-sm text-slate-600">Gérez vos ouvriers et leur affectation aux chantiers.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/equipes/nouveau')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter un ouvrier
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr] mb-8">
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom ou poste"
              className="w-full border-0 outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <label className="text-sm font-medium text-slate-700">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
            >
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="en_conge">En congé</option>
            </select>
          </div>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-5 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">Chargement des ouvriers...</div>
        ) : ouvriers.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 shadow-sm border border-slate-200 text-center text-slate-600">
            <Users className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="text-lg font-semibold">Aucun ouvrier</p>
            <p className="mt-2 text-sm text-slate-500">Ajoutez des ouvriers pour constituer vos équipes.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {ouvriers.map((ouvrier) => (
              <button
                key={ouvrier.id_ouvrier}
                type="button"
                onClick={() => setSelected(ouvrier)}
                className="group text-left rounded-3xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                      {ouvrier.prenom.charAt(0)}{ouvrier.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{ouvrier.prenom} {ouvrier.nom}</p>
                      {ouvrier.poste && <p className="text-sm text-slate-500">{ouvrier.poste}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${STATUT_CLASSES[ouvrier.statut] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {STATUT_LABELS[ouvrier.statut] || ouvrier.statut}
                  </span>
                </div>

                <div className="grid gap-2">
                  {ouvrier.telephone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      {ouvrier.telephone}
                    </div>
                  )}
                  {ouvrier.taux_horaire && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      {parseFloat(ouvrier.taux_horaire).toFixed(2)} €/h
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <EditModal
          ouvrier={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); fetchOuvriers(); }}
        />
      )}
    </AppLayout>
  );
}
