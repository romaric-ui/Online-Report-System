'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Building2, UserCheck, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

const ROLE_LABELS = {
  admin:              'Administrateur',
  chef_chantier:      'Chef de chantier',
  conducteur_travaux: 'Conducteur de travaux',
  ouvrier:            'Ouvrier',
};
const ROLE_CLASSES = {
  admin:              'bg-violet-100 text-violet-700',
  chef_chantier:      'bg-blue-100 text-blue-700',
  conducteur_travaux: 'bg-emerald-100 text-emerald-700',
  ouvrier:            'bg-slate-100 text-slate-600',
};

export default function InvitationPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const code   = params.code;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [invitation, setInvitation]   = useState(null);
  const [loadingInv, setLoadingInv]   = useState(true);
  const [invError, setInvError]       = useState('');

  // Formulaire création de compte
  const [nom, setNom]               = useState('');
  const [prenom, setPrenom]         = useState('');
  const [password, setPassword]     = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [code]);

  const fetchInvitation = async () => {
    setLoadingInv(true);
    setInvError('');
    try {
      const res  = await fetch(`/api/invitations/${code}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Invitation introuvable');
      setInvitation(json.data);
    } catch (err) {
      setInvError(err.message);
    } finally {
      setLoadingInv(false);
    }
  };

  const handleAccepterConnecte = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      const res  = await fetch(`/api/invitations/${code}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id_utilisateur: parseInt(session.user.id, 10) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setSuccess(true);
      setTimeout(() => router.push('/dashboard-projet'), 2000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreerCompte = async (e) => {
    e.preventDefault();
    setFormError('');
    if (password !== passwordConf) { setFormError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 8) { setFormError('Le mot de passe doit contenir au moins 8 caractères'); return; }

    setSubmitting(true);
    try {
      const res  = await fetch(`/api/invitations/${code}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nom,
          prenom,
          email:        invitation.email,
          mot_de_passe: password,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setSuccess(true);
      setTimeout(() => router.push('/'), 2500);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── États de chargement ──
  if (loadingInv) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Vérification de l&apos;invitation…</div>
      </div>
    );
  }

  if (invError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation invalide</h1>
          <p className="text-slate-500 text-sm mb-6">{invError}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="rounded-full bg-emerald-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Bienvenue !</h1>
          <p className="text-slate-500 text-sm">
            Vous avez rejoint <strong>{invitation.entreprise_nom}</strong>. Redirection en cours…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8 max-w-md w-full">

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="rounded-2xl bg-indigo-600 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Invitation</h1>
          <p className="text-slate-500 text-sm">
            Vous avez été invité à rejoindre
          </p>
          <p className="text-lg font-semibold text-indigo-600 mt-1">{invitation.entreprise_nom}</p>
          <div className="mt-3">
            <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${ROLE_CLASSES[invitation.role_nom] || 'bg-slate-100 text-slate-700'}`}>
              {ROLE_LABELS[invitation.role_nom] || invitation.role_nom}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3">Pour : <strong>{invitation.email}</strong></p>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-sm mb-5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        {/* ── Cas 1 : utilisateur connecté ── */}
        {status === 'authenticated' && (
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-1">Connecté en tant que</p>
            <p className="font-semibold text-slate-900 mb-5">{session.user.email}</p>
            <button
              type="button"
              onClick={handleAccepterConnecte}
              disabled={submitting}
              className="w-full py-3 rounded-3xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {submitting ? 'Acceptation…' : 'Accepter l\'invitation'}
            </button>
          </div>
        )}

        {/* ── Cas 2 : non connecté — créer un compte ── */}
        {status !== 'authenticated' && status !== 'loading' && (
          <form onSubmit={handleCreerCompte} className="space-y-4">
            <p className="text-sm text-slate-600 text-center mb-4">
              Créez votre compte pour rejoindre l&apos;équipe.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  required
                  placeholder="Jean"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  required
                  placeholder="Dupont"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={invitation.email}
                readOnly
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="8 caractères minimum"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmer le mot de passe</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={passwordConf}
                onChange={e => setPasswordConf(e.target.value)}
                required
                placeholder="Répétez le mot de passe"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-3xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {submitting ? 'Création du compte…' : 'Créer mon compte et rejoindre'}
            </button>

            <p className="text-center text-xs text-slate-400">
              Vous avez déjà un compte ?{' '}
              <button type="button" onClick={() => router.push('/')} className="text-indigo-600 underline">
                Connectez-vous
              </button>{' '}
              puis revenez sur ce lien.
            </p>
          </form>
        )}

        {status === 'loading' && (
          <div className="text-center text-slate-400 text-sm py-4">Chargement…</div>
        )}
      </div>
    </div>
  );
}
