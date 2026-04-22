'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Plus, Users, Phone, Briefcase, Save } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Modal from '../components/Modal';

const STATUT_LABELS = {
  actif:    'Actif',
  inactif:  'Inactif',
  en_conge: 'En congé',
};

const STATUT_CLASSES = {
  actif:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactif:  'bg-slate-100 text-slate-700 border-slate-200',
  en_conge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const POSTES = [
  'Maçon', 'Électricien', 'Plombier', 'Peintre', 'Carreleur',
  'Charpentier', 'Ferronnier', 'Manœuvre', "Chef d'équipe",
  "Conducteur d'engins", 'Autre',
];

// ── Formulaire ajout ouvrier ──────────────────────────────────────────────────
function AddOuvrierForm({ onSaved, onClose }) {
  const [values, setValues] = useState({
    nom: '', prenom: '', telephone: '', poste: '',
    specialite: '', taux_horaire: '', date_embauche: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (f) => (e) => setValues((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.nom.trim() || !values.prenom.trim()) {
      setError('Le nom et le prénom sont requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/ouvriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Erreur lors de la création");
      onSaved();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 text-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Nom *</span>
          <input value={values.nom} onChange={set('nom')} className={inputCls} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Prénom *</span>
          <input value={values.prenom} onChange={set('prenom')} className={inputCls} required />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Téléphone</span>
          <input type="tel" value={values.telephone} onChange={set('telephone')} className={inputCls} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Poste</span>
          <select value={values.poste} onChange={set('poste')} className={inputCls}>
            <option value="">— Sélectionner —</option>
            {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Spécialité</span>
        <input value={values.specialite} onChange={set('specialite')} placeholder="Ex : Électricité industrielle..." className={inputCls} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Taux horaire (€)</span>
          <input type="number" step="0.01" min="0" value={values.taux_horaire} onChange={set('taux_horaire')} className={inputCls} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Date d'embauche</span>
          <input type="date" value={values.date_embauche} onChange={set('date_embauche')} className={inputCls} />
        </label>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="w-full sm:w-auto rounded-3xl border border-slate-200 px-5 py-3 text-slate-700 hover:bg-slate-50 transition text-sm font-medium">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60 text-sm">
          <Save className="w-4 h-4" />{saving ? 'Ajout...' : "Ajouter l'ouvrier"}
        </button>
      </div>
    </form>
  );
}

// ── Formulaire édition ouvrier ────────────────────────────────────────────────
function EditOuvrierForm({ ouvrier, onClose, onSaved }) {
  const [values, setValues] = useState({
    nom:          ouvrier.nom || '',
    prenom:       ouvrier.prenom || '',
    telephone:    ouvrier.telephone || '',
    poste:        ouvrier.poste || '',
    specialite:   ouvrier.specialite || '',
    taux_horaire: ouvrier.taux_horaire || '',
    statut:       ouvrier.statut || 'actif',
    date_embauche: ouvrier.date_embauche?.slice(0, 10) || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (f) => (e) => setValues((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.nom.trim() || !values.prenom.trim()) { setError('Le nom et le prénom sont requis.'); return; }
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

  const inputCls = 'w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 text-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Nom *</span>
          <input value={values.nom} onChange={set('nom')} className={inputCls} required /></label>
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Prénom *</span>
          <input value={values.prenom} onChange={set('prenom')} className={inputCls} required /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Téléphone</span>
          <input type="tel" value={values.telephone} onChange={set('telephone')} className={inputCls} /></label>
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Poste</span>
          <select value={values.poste} onChange={set('poste')} className={inputCls}>
            <option value="">— Sélectionner —</option>
            {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Statut</span>
          <select value={values.statut} onChange={set('statut')} className={inputCls}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="en_conge">En congé</option>
          </select>
        </label>
        <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Taux horaire (€)</span>
          <input type="number" step="0.01" value={values.taux_horaire} onChange={set('taux_horaire')} className={inputCls} /></label>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button type="button" onClick={handleDelete} className="rounded-3xl border border-red-200 px-5 py-3 text-red-600 hover:bg-red-50 transition text-sm font-medium">
          Supprimer
        </button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60 text-sm">
          <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function EquipesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [ouvriers, setOuvriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    fetchOuvriers();
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      const t = setTimeout(fetchOuvriers, 250);
      return () => clearTimeout(t);
    }
  }, [search, statut]);

  const fetchOuvriers = async () => {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      if (statut) p.set('statut', statut);
      const res = await fetch(`/api/ouvriers?${p.toString()}`);
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

        {/* ── En-tête ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Équipes</h1>
            <p className="mt-1 text-sm text-slate-600">Gérez vos ouvriers et leur affectation aux chantiers.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter un ouvrier
          </button>
        </div>

        {/* ── Filtres ── */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-[1fr_auto] mb-6 sm:mb-8">
          <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom ou poste"
              className="w-full border-0 outline-none text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>
          <div className="rounded-3xl bg-white px-4 sm:px-5 py-3 shadow-sm border border-slate-200 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 shrink-0">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none text-sm"
            >
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="en_conge">En congé</option>
            </select>
          </div>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-5 text-sm">{error}</div>}

        {/* ── Contenu ── */}
        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600 text-sm">Chargement des ouvriers...</div>
        ) : ouvriers.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 sm:p-12 shadow-sm border border-slate-200 text-center text-slate-600">
            <Users className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="text-base font-semibold">Aucun ouvrier</p>
            <p className="mt-2 text-sm text-slate-500">Ajoutez des ouvriers pour constituer vos équipes.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {ouvriers.map((o) => (
              <button
                key={o.id_ouvrier}
                type="button"
                onClick={() => setSelected(o)}
                className="group text-left rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base shrink-0">
                      {o.prenom.charAt(0)}{o.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm sm:text-base">{o.prenom} {o.nom}</p>
                      {o.poste && <p className="text-xs text-slate-500">{o.poste}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0 ${STATUT_CLASSES[o.statut] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {STATUT_LABELS[o.statut] || o.statut}
                  </span>
                </div>

                <div className="grid gap-2">
                  {o.telephone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />{o.telephone}
                    </div>
                  )}
                  {o.taux_horaire && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />{parseFloat(o.taux_horaire).toFixed(2)} €/h
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ajout ── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un ouvrier" size="md">
        <AddOuvrierForm
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchOuvriers(); }}
        />
      </Modal>

      {/* ── Modal édition ── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Modifier l'ouvrier" size="md">
        {selected && (
          <EditOuvrierForm
            ouvrier={selected}
            onClose={() => setSelected(null)}
            onSaved={() => { setSelected(null); fetchOuvriers(); }}
          />
        )}
      </Modal>
    </AppLayout>
  );
}
