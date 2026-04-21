'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Zap, Star, Crown, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';

// ─── Données des plans ────────────────────────────────────────────────────────

const PLANS = [
  {
    slug:        'essentiel',
    nom:         'Essentiel',
    prix_mensuel: 29,
    prix_annuel:  290,
    icon:        Zap,
    iconBg:      'bg-blue-100 text-blue-600',
    max_utilisateurs: 1,
    max_chantiers:    5,
    stockage_go:      2,
    features: [
      'Chantiers & journal de chantier',
      'Photos de chantier',
      'Tâches & suivi',
      'Rapports PDF',
      'Documents',
    ],
    highlight: false,
    badge: null,
    cta: 'Choisir ce plan',
  },
  {
    slug:        'pro',
    nom:         'Pro',
    prix_mensuel: 79,
    prix_annuel:  790,
    icon:        Star,
    iconBg:      'bg-indigo-100 text-indigo-600',
    max_utilisateurs: 5,
    max_chantiers:    15,
    stockage_go:      10,
    features: [
      'Tout le plan Essentiel',
      'Équipes & gestion des ouvriers',
      'Pointage & présences',
      'Matériel & équipements',
      'Budget & dépenses',
      'Chat d\'équipe',
      'Invitations membres',
    ],
    highlight: true,
    badge: 'Populaire',
    cta: 'Choisir ce plan',
  },
  {
    slug:        'enterprise',
    nom:         'Enterprise',
    prix_mensuel: null,
    prix_annuel:  null,
    icon:        Crown,
    iconBg:      'bg-amber-100 text-amber-600',
    max_utilisateurs: null,
    max_chantiers:    null,
    stockage_go:      100,
    features: [
      'Tout le plan Pro',
      'Utilisateurs illimités',
      'Chantiers illimités',
      'Gantt & chemin critique',
      'Module HSE complet',
      'API dédiée',
      'Support prioritaire',
    ],
    highlight: false,
    badge: null,
    cta: 'Nous contacter',
  },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUT_BADGE = {
  essai:   'bg-blue-100 text-blue-700 border-blue-200',
  actif:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  expire:  'bg-red-100 text-red-700 border-red-200',
  annule:  'bg-slate-100 text-slate-600 border-slate-200',
  impaye:  'bg-orange-100 text-orange-700 border-orange-200',
};

const STATUT_LABELS = {
  essai:   'Essai gratuit',
  actif:   'Actif',
  expire:  'Expiré',
  annule:  'Annulé',
  impaye:  'Impayé',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysLeft(dateStr) {
  if (!dateStr) return 0;
  return Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / 86400000));
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Inner page (needs useSearchParams → wrapped in Suspense) ────────────────

function AbonnementInner() {
  const router            = useRouter();
  const searchParams      = useSearchParams();
  const { status }        = useSession();

  const [abonnement, setAbonnement]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [annual, setAnnual]               = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // slug en cours
  const [checkoutError, setCheckoutError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const successParam  = searchParams.get('success');
  const canceledParam = searchParams.get('canceled');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    loadAbonnement();
  }, [status]);

  const loadAbonnement = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/abonnement');
      const json = await res.json();
      if (json.success) setAbonnement(json.data);
    } finally {
      setLoading(false);
    }
  };

  // ── Checkout Stripe ────────────────────────────────────────────────────────

  const handleChoosePlan = async (plan) => {
    if (plan.cta === 'Nous contacter') {
      window.location.href = 'mailto:contact@sgtec.com?subject=Plan Enterprise SGTEC';
      return;
    }
    setCheckoutError('');
    setCheckoutLoading(plan.slug);
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planSlug: plan.slug, periode: annual ? 'annuel' : 'mensuel' }),
      });
      const json = await res.json();
      if (!res.ok || !json.data?.url) throw new Error(json.error?.message || 'Erreur Stripe');
      window.location.href = json.data.url;
    } catch (err) {
      setCheckoutError(err.message);
      setCheckoutLoading(null);
    }
  };

  // ── Annulation ────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res  = await fetch('/api/stripe/cancel', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setShowCancelConfirm(false);
      await loadAbonnement();
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const currentSlug = abonnement?.slug || null;
  const essaiJours  = abonnement?.statut === 'essai' ? daysLeft(abonnement.date_essai_fin) : 0;
  const essaiPct    = Math.max(0, Math.round((essaiJours / 7) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gérer l'abonnement</h1>
        <p className="mt-1 text-gray-500 text-sm">Choisissez le plan adapté à votre activité.</p>
      </div>

      {/* ── Bandeaux retour Stripe ── */}
      {successParam === 'true' && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 mb-6 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          Paiement confirmé ! Votre abonnement est maintenant actif.
        </div>
      )}
      {canceledParam === 'true' && (
        <div className="flex items-center gap-3 rounded-2xl bg-yellow-50 border border-yellow-200 px-5 py-4 mb-6 text-yellow-700 text-sm font-medium">
          <X className="w-4 h-4 flex-shrink-0" />
          Paiement annulé. Vous pouvez choisir un plan à tout moment.
        </div>
      )}
      {checkoutError && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 mb-6 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {checkoutError}
        </div>
      )}

      {/* ── Abonnement actuel ── */}
      {!loading && abonnement && (
        <div className={`bg-white rounded-2xl border shadow-sm p-6 mb-8 ${['expire','impaye'].includes(abonnement.statut) ? 'border-red-200' : 'border-gray-100'}`}>

          {['expire','impaye'].includes(abonnement.statut) && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-4 text-red-700 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Votre abonnement a expiré. Choisissez un plan pour continuer.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-lg font-bold text-gray-900">{abonnement.plan_nom || '—'}</p>
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUT_BADGE[abonnement.statut] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUT_LABELS[abonnement.statut] || abonnement.statut}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {abonnement.statut === 'essai'
                  ? `Essai jusqu'au ${fmtDate(abonnement.date_essai_fin)}`
                  : abonnement.prochaine_facture
                    ? `Prochain renouvellement le ${fmtDate(abonnement.prochaine_facture)}`
                    : abonnement.date_fin
                      ? `Valide jusqu'au ${fmtDate(abonnement.date_fin)}`
                      : `Depuis le ${fmtDate(abonnement.date_debut)}`}
                {abonnement.periode && abonnement.statut === 'actif' && ` · Facturation ${abonnement.periode}`}
              </p>
            </div>

            {abonnement.statut === 'essai' && (
              <div className="w-full sm:w-64">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Essai gratuit</span>
                  <span className="font-semibold text-blue-600">{essaiJours} jour{essaiJours !== 1 ? 's' : ''} restant{essaiJours !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${essaiPct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toggle mensuel / annuel ── */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Annuel
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">2 mois offerts</span>
          </button>
        </div>
      </div>

      {/* ── Cards plans ── */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {PLANS.map(plan => {
          const isCurrent = currentSlug === plan.slug;
          const isLoading = checkoutLoading === plan.slug;
          const Icon = plan.icon;
          const prix = annual ? plan.prix_annuel : plan.prix_mensuel;

          return (
            <div
              key={plan.slug}
              className={`relative rounded-2xl p-6 flex flex-col border transition-all ${
                isCurrent
                  ? 'border-indigo-500 bg-indigo-50/30 shadow-lg shadow-indigo-100/50'
                  : plan.highlight
                    ? 'border-indigo-300 bg-white shadow-xl shadow-indigo-100/30 scale-[1.02]'
                    : 'border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {plan.badge && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    Plan actuel
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{plan.nom}</h3>
              </div>

              <div className="mb-5">
                {prix !== null ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      {annual && plan.prix_mensuel && (
                        <span className="text-sm text-gray-400 line-through mr-1">{plan.prix_mensuel * 12} €</span>
                      )}
                      <span className="text-3xl font-extrabold text-gray-900">{prix} €</span>
                      <span className="text-sm text-gray-400 ml-1">{annual ? '/ an' : '/ mois'}</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-emerald-600 mt-1 font-semibold">
                        Soit {Math.round(prix / 12)} €/mois — 2 mois offerts
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl font-extrabold text-gray-900">Sur devis</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {plan.max_utilisateurs !== null && (
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">
                    {plan.max_utilisateurs === 999 ? '∞' : plan.max_utilisateurs} utilisateur{plan.max_utilisateurs > 1 ? 's' : ''}
                  </span>
                )}
                {plan.max_chantiers !== null && (
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">
                    {plan.max_chantiers === 999 ? '∞' : plan.max_chantiers} chantiers
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">
                  {plan.stockage_go} Go
                </span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.highlight || isCurrent ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <Check className={`w-2.5 h-2.5 ${plan.highlight || isCurrent ? 'text-indigo-600' : 'text-gray-500'}`} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleChoosePlan(plan)}
                disabled={isCurrent || !!checkoutLoading}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                    : plan.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 disabled:opacity-60'
                      : plan.cta === 'Nous contacter'
                        ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                        : 'bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-60'
                }`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCurrent ? 'Plan actuel' : isLoading ? 'Redirection…' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-center text-sm text-gray-400 mb-8">
        Essai gratuit de 7 jours inclus. Carte bancaire requise à l'activation.
        Résiliable à tout moment.
      </p>

      {/* ── Annuler l'abonnement ── */}
      {abonnement?.statut === 'actif' && abonnement?.stripe_subscription_id && (
        <div className="text-center">
          {!showCancelConfirm ? (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-gray-400 hover:text-red-500 transition underline underline-offset-2"
            >
              Annuler mon abonnement
            </button>
          ) : (
            <div className="inline-flex flex-col items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-6 py-4 max-w-sm mx-auto">
              <p className="text-sm text-red-700 font-medium">
                Confirmer l'annulation ? Votre accès restera actif jusqu'à la fin de la période payée.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Garder
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {cancelLoading ? 'Annulation…' : 'Confirmer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Export avec Suspense (requis pour useSearchParams) ───────────────────────

export default function AbonnementPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }>
        <AbonnementInner />
      </Suspense>
    </AppLayout>
  );
}
