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
    <div className="min-h-screen py-8" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-6">
        <button
          type="button"
          onClick={() => router.push('/equipes')}
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(145deg, #6366F1, #4F46E5)', boxShadow: '6px 6px 12px rgba(79,70,229,0.35)' }}>
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Ajouter un ouvrier</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>Renseignez les informations de l'ouvrier.</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl p-4 mb-6 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="input-neu-label">Nom *</span>
                <input value={values.nom} onChange={handleChange('nom')} className="input-neu" required />
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Prénom *</span>
                <input value={values.prenom} onChange={handleChange('prenom')} className="input-neu" required />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="input-neu-label">Téléphone</span>
                <input type="tel" value={values.telephone} onChange={handleChange('telephone')} className="input-neu" />
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Poste</span>
                <select value={values.poste} onChange={handleChange('poste')} className="select-neu">
                  <option value="">— Sélectionner —</option>
                  {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            <label className="space-y-1.5">
              <span className="input-neu-label">Spécialité</span>
              <input
                value={values.specialite}
                onChange={handleChange('specialite')}
                placeholder="Ex : Carrelage grande surface, Électricité industrielle..."
                className="input-neu"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="input-neu-label">Taux horaire (€)</span>
                <input type="number" step="0.01" min="0" value={values.taux_horaire} onChange={handleChange('taux_horaire')} className="input-neu" />
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Date d'embauche</span>
                <input type="date" value={values.date_embauche} onChange={handleChange('date_embauche')} className="input-neu" />
              </label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push('/equipes')}
                className="btn btn-soft px-6 py-3"
              >
                Annuler
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Ajout en cours..." : "Ajouter l'ouvrier"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
