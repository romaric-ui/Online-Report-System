'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserPlus, ArrowLeft } from 'lucide-react';

const POSTES = [
  'Maçon', 'Électricien', 'Plombier', 'Peintre', 'Carreleur',
  'Charpentier', 'Ferronnier', 'Manœuvre', "Chef d'équipe",
  "Conducteur d'engins", 'Autre',
];

export default function NouvelOuvrierPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    poste: '',
    specialite: '',
    taux_horaire: '',
    date_embauche: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const handleChange = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.nom.trim() || !values.prenom.trim()) {
      setError('Le nom et le prénom sont requis.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/ouvriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error?.message || "Erreur lors de la création de l'ouvrier");
      router.push('/equipes');
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
          onClick={() => router.push('/equipes')}
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="rounded-[2rem] bg-white p-8 shadow-lg border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="rounded-3xl bg-indigo-600 p-4 text-white shadow-md">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ajouter un ouvrier</h1>
              <p className="mt-1 text-sm text-slate-500">Renseignez les informations de l'ouvrier.</p>
            </div>
          </div>

          {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Nom *</span>
                <input
                  value={values.nom}
                  onChange={handleChange('nom')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Prénom *</span>
                <input
                  value={values.prenom}
                  onChange={handleChange('prenom')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  required
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Téléphone</span>
                <input
                  type="tel"
                  value={values.telephone}
                  onChange={handleChange('telephone')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Poste</span>
                <select
                  value={values.poste}
                  onChange={handleChange('poste')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="">— Sélectionner —</option>
                  {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Spécialité</span>
              <input
                value={values.specialite}
                onChange={handleChange('specialite')}
                placeholder="Ex : Carrelage grande surface, Électricité industrielle..."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Taux horaire (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.taux_horaire}
                  onChange={handleChange('taux_horaire')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Date d'embauche</span>
                <input
                  type="date"
                  value={values.date_embauche}
                  onChange={handleChange('date_embauche')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push('/equipes')}
                className="rounded-3xl border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-100 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-8 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {loading ? "Ajout en cours..." : "Ajouter l'ouvrier"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
