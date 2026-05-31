'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileText, Building2, ArrowRight } from 'lucide-react';

export default function BienvenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user?.entrepriseId) {
      router.push('/dashboard-projet');
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Bienvenue sur SGTEC</h1>
          <p className="text-slate-500 text-lg">Que souhaitez-vous faire ?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Compte particulier */}
          <button
            onClick={() => router.push('/dashboard')}
            className="group p-8 rounded-[2rem] bg-white border-2 border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all text-left"
          >
            <div className="rounded-2xl bg-indigo-100 p-3 w-fit mb-4">
              <FileText className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Rapports d'inspection</h2>
            <p className="text-sm text-slate-500 mb-4">
              Créez des rapports d'inspection BTP professionnels. 1 rapport gratuit, puis abonnement.
            </p>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Commencer <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Compte entreprise */}
          <button
            onClick={() => router.push('/inscription')}
            className="group p-8 rounded-[2rem] bg-white border-2 border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all text-left"
          >
            <div className="rounded-2xl bg-emerald-100 p-3 w-fit mb-4">
              <Building2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Gestion de chantier</h2>
            <p className="text-sm text-slate-500 mb-4">
              Plateforme complète pour gérer vos chantiers, équipes, budgets et rapports. Essai gratuit 7 jours.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Créer mon entreprise <ArrowRight className="w-4 h-4" />
            </div>
          </button>

        </div>

        {/* Invitation */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Vous avez reçu une invitation ?{' '}
            <button
              onClick={() => router.push('/invitation')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Rejoindre une entreprise
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}