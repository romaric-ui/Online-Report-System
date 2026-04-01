'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, PackagePlus } from 'lucide-react';

const CATEGORIE_LABELS = {
  outil: 'Outil',
  engin: 'Engin',
  echafaudage: 'Échafaudage',
  protection: 'Protection',
  mesure: 'Mesure',
  autre: 'Autre',
};

const ETAT_LABELS = {
  neuf: 'Neuf',
  bon: 'Bon état',
  usage: 'Usagé',
  a_reparer: 'À réparer',
  hors_service: 'Hors service',
};

export default function NouveauMaterielPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    nom: '',
    categorie: 'outil',
    reference: '',
    numero_serie: '',
    marque: '',
    etat: 'bon',
    date_achat: '',
    prix_achat: '',
    date_prochaine_maintenance: '',
    localisation: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const handleChange = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.nom.trim()) { setError('Le nom est requis.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/materiel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error?.message || 'Erreur lors de la création');
      router.push('/materiel');
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <button
          type="button"
          onClick={() => router.push('/materiel')}
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l'inventaire
        </button>

        <div className="rounded-[2rem] bg-white p-8 shadow-lg border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="rounded-3xl bg-indigo-600 p-4 text-white shadow-md">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ajouter du matériel</h1>
              <p className="mt-1 text-sm text-slate-500">Renseignez les informations du matériel.</p>
            </div>
          </div>

          {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Nom *</span>
                <input value={values.nom} onChange={handleChange('nom')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Catégorie *</span>
                <select value={values.categorie} onChange={handleChange('categorie')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
                  {Object.entries(CATEGORIE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Marque</span>
                <input value={values.marque} onChange={handleChange('marque')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Référence</span>
                <input value={values.reference} onChange={handleChange('reference')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Numéro de série</span>
                <input value={values.numero_serie} onChange={handleChange('numero_serie')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">État</span>
                <select value={values.etat} onChange={handleChange('etat')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
                  {Object.entries(ETAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Date d'achat</span>
                <input type="date" value={values.date_achat} onChange={handleChange('date_achat')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Prix d'achat (€)</span>
                <input type="number" step="0.01" min="0" value={values.prix_achat} onChange={handleChange('prix_achat')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Prochaine maintenance</span>
                <input type="date" value={values.date_prochaine_maintenance} onChange={handleChange('date_prochaine_maintenance')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Localisation</span>
                <input value={values.localisation} onChange={handleChange('localisation')} placeholder="Dépôt, atelier..." className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea value={values.notes} onChange={handleChange('notes')} rows={3} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button type="button" onClick={() => router.push('/materiel')} className="rounded-3xl border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-100 transition">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-8 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60">
                {loading ? 'Ajout en cours...' : 'Ajouter le matériel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
