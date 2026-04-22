'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Users, UserPlus, Copy, Check,
  Trash2, ChevronDown, Clock, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';
import Modal from '../../components/Modal';

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
const STATUT_CLASSES = {
  en_attente: 'bg-amber-100 text-amber-700',
  acceptee:   'bg-emerald-100 text-emerald-700',
  expiree:    'bg-slate-100 text-slate-400',
  annulee:    'bg-red-100 text-red-600',
};
const STATUT_LABELS = {
  en_attente: 'En attente',
  acceptee:   'Acceptée',
  expiree:    'Expirée',
  annulee:    'Annulée',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function EquipePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [loadingInvit, setLoadingInvit] = useState(true);

  // Modal invitation
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('');
  const [invSending, setInvSending] = useState(false);
  const [invLien, setInvLien] = useState('');
  const [copied, setCopied] = useState(false);
  const [invError, setInvError] = useState('');

  const [error, setError] = useState('');
  const myId = parseInt(session?.user?.id, 10);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    fetchMembers();
    fetchInvitations();
  }, [status]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res  = await fetch('/api/equipe-projet');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setMembers(json.data.members);
      setRoles(json.data.roles);
      if (!invRole && json.data.roles.length) {
        const def = json.data.roles.find(r => r.nom !== 'admin');
        if (def) setInvRole(String(def.id_role_entreprise));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchInvitations = async () => {
    setLoadingInvit(true);
    try {
      const res  = await fetch('/api/invitations');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setInvitations(json.data);
    } catch {
      // non critique
    } finally {
      setLoadingInvit(false);
    }
  };

  const handleInviter = async (e) => {
    e.preventDefault();
    setInvError('');
    setInvLien('');
    if (!invEmail || !invRole) { setInvError('Email et rôle requis'); return; }
    setInvSending(true);
    try {
      const res  = await fetch('/api/invitations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: invEmail, id_role_entreprise: parseInt(invRole, 10) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setInvLien(json.data.lien_invitation);
      setInvEmail('');
      fetchInvitations();
    } catch (err) {
      setInvError(err.message);
    } finally {
      setInvSending(false);
    }
  };

  const handleCopier = () => {
    navigator.clipboard.writeText(invLien);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnnulerInvitation = async (id) => {
    try {
      const res  = await fetch(`/api/invitations/${id}/cancel`, { method: 'PUT' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      fetchInvitations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangerRole = async (userId, newRoleId) => {
    try {
      const res  = await fetch('/api/equipe-projet', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id_utilisateur: userId, id_role_entreprise: parseInt(newRoleId, 10) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRetirer = async (userId, nom) => {
    if (!confirm(`Retirer ${nom} de l'entreprise ?`)) return;
    try {
      const res  = await fetch(`/api/equipe-projet?id_utilisateur=${userId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const invitationsEnAttente = invitations.filter(i => i.statut === 'en_attente');
  const invitationsPassees   = invitations.filter(i => i.statut !== 'en_attente');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard-projet')}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-600 p-2.5 text-white shadow-sm shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Mon équipe</h1>
                <p className="text-xs sm:text-sm text-gray-500">Gérez les membres et les invitations</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Inviter un membre</span>
            <span className="sm:hidden">Inviter</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-5 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button type="button" onClick={() => setError('')} className="ml-auto text-xs underline">Fermer</button>
          </div>
        )}

        {/* ── Membres ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Membres <span className="text-gray-400 font-normal text-sm">({members.length})</span>
            </h2>
          </div>

          {loadingMembers ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Chargement…</div>
          ) : members.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Aucun membre. Invitez votre équipe !</div>
          ) : (
            <>
              {/* Table desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Membre</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Depuis</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {members.map(m => {
                      const isSelf = m.id_utilisateur === myId;
                      return (
                        <tr key={m.id_utilisateur} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-gray-900">
                              {m.prenom} {m.nom}
                              {isSelf && <span className="ml-2 text-xs text-indigo-500 font-normal">(vous)</span>}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-gray-500 text-xs">{m.email}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="relative">
                              <select
                                value={m.id_role_entreprise || ''}
                                onChange={e => handleChangerRole(m.id_utilisateur, e.target.value)}
                                disabled={isSelf}
                                className={`appearance-none rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition pr-7 border-transparent ${ROLE_CLASSES[m.role_nom] || 'bg-gray-100 text-gray-600'} ${isSelf ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:brightness-95'}`}
                              >
                                {roles.map(r => (
                                  <option key={r.id_role_entreprise} value={r.id_role_entreprise}>
                                    {ROLE_LABELS[r.nom] || r.nom}
                                  </option>
                                ))}
                              </select>
                              {!isSelf && <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-400">{fmtDate(m.created_at)}</td>
                          <td className="px-4 py-3.5">
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleRetirer(m.id_utilisateur, `${m.prenom} ${m.nom}`)}
                                className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition"
                                title="Retirer de l'équipe"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="md:hidden divide-y divide-gray-50">
                {members.map(m => {
                  const isSelf = m.id_utilisateur === myId;
                  return (
                    <div key={m.id_utilisateur} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {m.prenom} {m.nom}
                            {isSelf && <span className="ml-1.5 text-xs text-indigo-500 font-normal">(vous)</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{m.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Depuis {fmtDate(m.created_at)}</p>
                        </div>
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRetirer(m.id_utilisateur, `${m.prenom} ${m.nom}`)}
                            className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-3">
                        <select
                          value={m.id_role_entreprise || ''}
                          onChange={e => handleChangerRole(m.id_utilisateur, e.target.value)}
                          disabled={isSelf}
                          className={`appearance-none rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition border-transparent ${ROLE_CLASSES[m.role_nom] || 'bg-gray-100 text-gray-600'} ${isSelf ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {roles.map(r => (
                            <option key={r.id_role_entreprise} value={r.id_role_entreprise}>
                              {ROLE_LABELS[r.nom] || r.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Invitations en attente ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Invitations en attente</h2>
            </div>
            {invitationsEnAttente.length > 0 && (
              <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full w-5 h-5 flex items-center justify-center">
                {invitationsEnAttente.length}
              </span>
            )}
          </div>
          {loadingInvit ? (
            <div className="px-5 py-6 text-center text-sm text-gray-400">Chargement…</div>
          ) : invitationsEnAttente.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-gray-400">Aucune invitation en attente</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {invitationsEnAttente.map(inv => (
                <li key={inv.id_invitation} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold mr-1.5 ${ROLE_CLASSES[inv.role_nom] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[inv.role_nom] || inv.role_nom}
                      </span>
                      · expire {fmtDate(inv.date_expiration)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAnnulerInvitation(inv.id_invitation)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                    title="Annuler"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Historique ── */}
        {invitationsPassees.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Historique des invitations</h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {invitationsPassees.slice(0, 5).map(inv => (
                <li key={inv.id_invitation} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
                  <p className="text-sm text-gray-600 truncate min-w-0">{inv.email}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${STATUT_CLASSES[inv.statut] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUT_LABELS[inv.statut] || inv.statut}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Modal Inviter ── */}
      <Modal isOpen={showInviteModal} onClose={() => { setShowInviteModal(false); setInvLien(''); setInvError(''); }} title="Inviter un membre" size="sm">
        <form onSubmit={handleInviter} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Adresse email</label>
            <input
              type="email"
              value={invEmail}
              onChange={e => setInvEmail(e.target.value)}
              placeholder="email@exemple.com"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Rôle</label>
            <div className="relative">
              <select
                value={invRole}
                onChange={e => setInvRole(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
              >
                <option value="">Choisir un rôle…</option>
                <option value="1">Admin</option>
                <option value="2">Chef de chantier</option>
                <option value="3">Conducteur de travaux</option>
                <option value="4">Ouvrier</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {invError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{invError}</p>}

          <button
            type="submit"
            disabled={invSending}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
          >
            {invSending ? 'Envoi…' : "Envoyer l'invitation"}
          </button>
        </form>

        {invLien && (
          <div className="mt-5 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
            <p className="text-xs text-indigo-700 font-medium mb-2">Lien d'invitation généré :</p>
            <p className="text-xs text-gray-600 break-all mb-3">{invLien}</p>
            <button
              type="button"
              onClick={handleCopier}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
            <p className="text-xs text-gray-400 mt-2">Partagez ce lien par WhatsApp ou email.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
