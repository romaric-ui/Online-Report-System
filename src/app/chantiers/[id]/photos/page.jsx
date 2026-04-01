'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, Image, Filter, Camera, FileImage, UploadCloud, CheckCircle } from 'lucide-react';

const PHOTO_TYPES = [
  { value: '', label: 'Tous' },
  { value: 'avant', label: 'Avant' },
  { value: 'pendant', label: 'Pendant' },
  { value: 'apres', label: 'Après' },
  { value: 'probleme', label: 'Problème' },
];

export default function ChantierPhotosPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ type_photo: 'avant', legende: '', fichier: null });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      loadPhotos();
    }
  }, [status, id, typeFilter]);

  const loadPhotos = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type_photo', typeFilter);
      const res = await fetch(`/api/chantiers/${id}/photos?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Impossible de charger les photos');
      }
      setPhotos(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setForm((prev) => ({ ...prev, fichier: event.target.files?.[0] || null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fichier) {
      setError('Veuillez sélectionner un fichier image.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('file', form.fichier);
      data.append('type_photo', form.type_photo);
      data.append('legende', form.legende);
      const res = await fetch(`/api/chantiers/${id}/photos`, {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Erreur lors de l’ajout de la photo');
      }
      setForm({ type_photo: 'avant', legende: '', fichier: null });
      loadPhotos();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Photos du chantier</h1>
            <p className="mt-2 text-slate-500">Gérez la galerie de photos du chantier.</p>
          </div>
          <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <Plus className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr] mb-8">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Galerie</h2>
                <p className="text-sm text-slate-500">Filtres et aperçu des photos.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <label className="flex-1">
                <span className="sr-only">Type de photo</span>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
                  {PHOTO_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                <Filter className="w-4 h-4" />
                Filtrer
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>
            ) : null}

            {loading ? (
              <p className="mt-6 text-slate-600">Chargement des photos...</p>
            ) : photos.length === 0 ? (
              <div className="mt-6 rounded-3xl bg-slate-50 p-8 text-center text-slate-600">Aucune photo pour l'instant.</div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {photos.map((photo) => (
                  <div key={photo.id_photo} className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                    <img src={photo.url} alt={photo.legende || 'Photo chantier'} className="h-52 w-full object-cover" />
                    <div className="p-4">
                      <p className="text-sm font-semibold text-slate-900">{PHOTO_TYPES.find((type) => type.value === photo.type_photo)?.label || 'Autre'}</p>
                      <p className="mt-2 text-sm text-slate-600">{photo.legende || 'Sans légende'}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{photo.created_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-3xl bg-emerald-500 p-3 text-white shadow-md">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Ajouter des photos</h2>
                <p className="text-sm text-slate-500">Téléversez de nouvelles images pour le chantier.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Fichier photo</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-slate-700" />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Type de photo</span>
                <select value={form.type_photo} onChange={(e) => setForm((prev) => ({ ...prev, type_photo: e.target.value }))} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
                  {PHOTO_TYPES.filter((opt) => opt.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Légende</span>
                <textarea value={form.legende} onChange={(e) => setForm((prev) => ({ ...prev, legende: e.target.value }))} rows={4} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>

              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60">
                <CheckCircle className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Ajouter la photo'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
