'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '../components/AppLayout';
import {
  Settings, Upload, Save, Loader2, CheckCircle2,
  Building2, Palette, FileText, Phone, Mail, Globe, MapPin,
  Lock, Zap, CheckCircle, User,
} from 'lucide-react';

export default function ParametresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isParticulier = !session?.user?.entrepriseId;

  const [form, setForm] = useState({
    nom: '', logo_url: '', couleur_principale: '#2563eb',
    pied_page_rapport: '', adresse: '', telephone: '',
    email_contact: '', site_web: '',
  });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchParametres();
  }, [status]);

  const fetchParametres = async () => {
    try {
      if (!session?.user?.entrepriseId) {
        // Compte particulier — charger depuis le profil utilisateur
        const res = await fetch('/api/profil');
        const json = await res.json();
        if (json.success && json.data) {
          setForm(prev => ({
            ...prev,
            nom: json.data.prenom + ' ' + json.data.nom,
            couleur_principale: json.data.couleur_rapport || '#2563eb',
            pied_page_rapport: json.data.pied_page_rapport || '',
          }));
        }
      } else {
        const res = await fetch('/api/parametres');
        const json = await res.json();
        if (json.success && json.data) {
          setForm(prev => ({ ...prev, ...json.data }));
        }
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Erreur');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch('/api/uploads/logo', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Erreur upload');
      setForm(prev => ({ ...prev, logo_url: json.data.logo_url }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl text-white" style={{ background: form.couleur_principale || '#2563eb' }}>
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Paramètres</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isParticulier ? 'Personnalisez vos rapports d\'inspection' : 'Personnalisez votre entreprise et vos rapports'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-white font-semibold transition disabled:opacity-60"
            style={{ background: form.couleur_principale || '#2563eb' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Bannière upgrade pour particuliers */}
        {isParticulier && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="font-semibold text-indigo-700 text-sm">Plan gratuit</p>
                <p className="text-xs text-indigo-500">Passez au Pro pour débloquer logo, templates et personnalisation complète</p>
              </div>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Passer au Pro
            </button>
          </div>
        )}

        {/* Infos personnelles (compte particulier) */}
        {isParticulier && (
          <div className="p-6 rounded-2xl border space-y-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Informations personnelles</h2>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nom affiché dans les rapports</label>
              <input
                type="text"
                value={form.nom || ''}
                onChange={e => set('nom', e.target.value)}
                className="input-neu w-full"
                placeholder="Votre nom complet"
              />
            </div>
          </div>
        )}

        {/* Identité entreprise (compte entreprise seulement) */}
        {!isParticulier && (
          <div className="p-6 rounded-2xl border space-y-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Identité de l'entreprise</h2>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nom de l'entreprise</label>
              <input type="text" value={form.nom || ''} onChange={e => set('nom', e.target.value)}
                className="input-neu w-full" placeholder="Nom affiché dans les rapports PDF" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Logo</label>
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <div className="w-24 h-16 rounded-xl border flex items-center justify-center overflow-hidden" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                    <img src={form.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-24 h-16 rounded-xl border flex items-center justify-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                    <Building2 className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div>
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-2xl border px-4 py-2.5 text-sm font-medium transition hover:bg-blue-50 hover:border-blue-300"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Upload...' : 'Choisir un logo'}
                    <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PNG, JPG, SVG, WEBP — max 2 MB</p>
                </div>
                {form.logo_url && (
                  <button onClick={() => set('logo_url', '')} className="text-xs text-red-500 hover:underline">Supprimer</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />Adresse
                </label>
                <input type="text" value={form.adresse || ''} onChange={e => set('adresse', e.target.value)}
                  className="input-neu w-full" placeholder="Adresse de l'entreprise" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <Phone className="w-3.5 h-3.5 inline mr-1" />Téléphone
                </label>
                <input type="text" value={form.telephone || ''} onChange={e => set('telephone', e.target.value)}
                  className="input-neu w-full" placeholder="+229 XX XX XX XX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <Mail className="w-3.5 h-3.5 inline mr-1" />Email de contact
                </label>
                <input type="email" value={form.email_contact || ''} onChange={e => set('email_contact', e.target.value)}
                  className="input-neu w-full" placeholder="contact@monentreprise.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <Globe className="w-3.5 h-3.5 inline mr-1" />Site web
                </label>
                <input type="text" value={form.site_web || ''} onChange={e => set('site_web', e.target.value)}
                  className="input-neu w-full" placeholder="https://monentreprise.com" />
              </div>
            </div>
          </div>
        )}

        {/* Personnalisation rapports — gratuit pour tous */}
        <div className="p-6 rounded-2xl border space-y-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Personnalisation des rapports PDF</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Couleur principale</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.couleur_principale || '#2563eb'}
                onChange={e => set('couleur_principale', e.target.value)}
                className="w-12 h-10 rounded-xl border cursor-pointer" style={{ borderColor: 'var(--border-color)' }} />
              <input type="text" value={form.couleur_principale || '#2563eb'}
                onChange={e => set('couleur_principale', e.target.value)}
                className="input-neu w-36" placeholder="#2563eb" />
              <div className="flex-1 h-10 rounded-xl flex items-center justify-center text-white text-sm font-medium"
                style={{ background: form.couleur_principale || '#2563eb' }}>
                Aperçu couleur
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              <FileText className="w-3.5 h-3.5 inline mr-1" />Pied de page des rapports
            </label>
            <input type="text" value={form.pied_page_rapport || ''} onChange={e => set('pied_page_rapport', e.target.value)}
              className="input-neu w-full" placeholder="Ex: Mon Bureau BTP — Confidentiel" />
          </div>

          {/* Aperçu */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Aperçu de l'en-tête PDF</p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-4 text-white" style={{ background: form.couleur_principale || '#2563eb' }}>
                <div className="flex items-center gap-3">
                  {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-8 object-contain" />}
                  <div>
                    <p className="font-bold text-sm">RAPPORT D'INSPECTION BTP</p>
                    <p className="text-xs opacity-80">{form.nom || 'Votre nom'}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 text-xs flex justify-between" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                <span>{form.pied_page_rapport || `${form.nom || 'Mon Bureau'} — Rapport d'inspection`}</span>
                <span>Page 1 / N</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sections Pro verrouillées pour particuliers */}
        {isParticulier && (
          <div className="p-6 rounded-2xl border border-dashed space-y-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-400">Fonctionnalités Pro</h2>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full">PRO</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Logo personnalisé', desc: 'Ajoutez votre logo sur tous les rapports' },
                { label: 'Templates de rapports', desc: 'Choisissez parmi des modèles professionnels' },
                { label: 'Polices personnalisées', desc: 'Changez la typographie de vos rapports' },
                { label: 'Mise en page avancée', desc: 'Réorganisez les sections de vos rapports' },
              ].map(({ label, desc }) => (
                <div key={label} className="p-4 rounded-xl border flex items-start gap-3 opacity-60"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                  <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
            >
              Débloquer toutes les fonctionnalités — 9€/mois
            </button>
          </div>
        )}

      </div>

      {/* Modal Paywall */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Passez au plan Pro</h3>
              <p className="text-gray-500 text-sm">Débloquez la personnalisation complète de vos rapports.</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                'Logo personnalisé sur tous les rapports',
                'Templates professionnels BTP',
                'Polices et mise en page avancées',
                'Rapports illimités',
                'Support prioritaire',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-indigo-600">9€</span>
              <span className="text-gray-500">/mois</span>
              <p className="text-xs text-gray-400 mt-1">Sans engagement — annulable à tout moment</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPaywall(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition">
                Plus tard
              </button>
              <button onClick={() => router.push('/abonnement-particulier')}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition shadow-lg">
                S'abonner — 9€/mois
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}