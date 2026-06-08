'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Lock, Zap, CheckCircle, ArrowLeft, Building2,
} from 'lucide-react';

export default function UpgradePage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Fonctionnalité réservée
          </h1>
          <p className="text-slate-500">
            Cette section est réservée aux comptes entreprise.
            Créez votre compte ou passez au plan Pro.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Plan Pro particulier */}
          <div className="p-6 rounded-2xl bg-white border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900">Plan Pro</h2>
            </div>
            <p className="text-3xl font-black text-indigo-600 mb-1">9€<span className="text-sm font-normal text-slate-500">/mois</span></p>
            <p className="text-xs text-slate-500 mb-4">Rapports d'inspection illimités</p>
            <div className="space-y-2 mb-4">
              {[
                'Rapports illimités',
                'Logo personnalisé',
                'Templates pro',
                'Export PDF HD',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/abonnement-particulier')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition"
            >
              S'abonner
            </button>
          </div>

          {/* Compte entreprise */}
          <div className="p-6 rounded-2xl bg-white border-2 border-emerald-200 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900">Compte Entreprise</h2>
            </div>
            <p className="text-3xl font-black text-emerald-600 mb-1">29€<span className="text-sm font-normal text-slate-500">/mois</span></p>
            <p className="text-xs text-slate-500 mb-4">Gestion complète de chantiers</p>
            <div className="space-y-2 mb-4">
              {[
                'Chantiers illimités',
                'Équipes & pointage',
                'Budget & dépenses',
                'HSE & sécurité',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/inscription')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition"
            >
              Créer mon compte
            </button>
          </div>

        </div>

        {/* Voir la démo */}
        <div className="text-center space-y-3">
          <button
            onClick={() => router.push('/demo')}
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Voir la démo en direct →
          </button>
          <br />
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

      </div>
    </div>
  );
}