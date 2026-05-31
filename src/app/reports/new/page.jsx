'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReportForm from '../../components/ReportForm';
import { Zap, Lock, CheckCircle } from 'lucide-react';

export default function NewReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [limiteInfo, setLimiteInfo] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (session?.user?.role === 'admin') { router.push('/admin/dashboard'); return; }
    if (!session?.user?.entrepriseId) fetchLimite();
  }, [session, status, router]);

  const fetchLimite = async () => {
    try {
      const res = await fetch('/api/reports/check-limite');
      const json = await res.json();
      if (json.success) setLimiteInfo(json.data);
    } catch {}
  };

  const addReport = async (formData) => {
    // Vérifier la limite avant de soumettre
    if (!session?.user?.entrepriseId && limiteInfo?.limite_atteinte) {
      setPendingFormData(formData);
      setShowPaywall(true);
      return;
    }

    await submitReport(formData);
  };

  const submitReport = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        numero_affaire:    formData.noAffaire       || '',
        numero_rapport:    formData.noRapport        || '',
        nom_chantier:      formData.proprietaire     || '',
        adresse_chantier:  formData.adresseOuvrage   || null,
        date_visite:       formData.dateIntervention || null,
        phase:             formData.phase            || null,
        equipe_presente:   formData.intervenants?.length
                             ? formData.intervenants
                             : (formData.intervenant ? [formData.intervenant] : null),
        objectifs_limites: formData.objectifLimites  || null,
        deroulement:       formData.deroulementVisite || null,
        investigation:     formData.investigationPoints?.length ? formData.investigationPoints : null,
        autres_points:     formData.autresPoints?.length        ? formData.autresPoints        : null,
        conclusion:        formData.conclusion       || null,
        photo_couverture:  formData.coverImage       || null,
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 402) {
        setPendingFormData(formData);
        setShowPaywall(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la création du rapport');
      }

      router.push('/dashboard');
    } catch (err) {
      alert(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Bannière Pro pour comptes particuliers */}
      {!session?.user?.entrepriseId && limiteInfo && !limiteInfo.is_abonne && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">
              {limiteInfo.limite_atteinte
                ? 'Limite gratuite atteinte — passez au Pro pour continuer'
                : `Plan gratuit — ${1 - (limiteInfo.nb_rapports || 0)} rapport gratuit restant`
              }
            </span>
          </div>
          <button
            onClick={() => setShowPaywall(true)}
            className="shrink-0 px-4 py-1.5 bg-white text-indigo-600 rounded-full text-sm font-semibold hover:bg-indigo-50 transition-all"
          >
            Passer au Pro
          </button>
        </div>
      )}

      <ReportForm
        addReport={addReport}
        onCancel={() => router.push('/dashboard')}
      />

      {/* Modal Paywall */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Passez au plan Pro</h3>
              <p className="text-gray-500 text-sm">
                Vous avez utilisé votre rapport gratuit. Abonnez-vous pour créer des rapports illimités.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                'Rapports d\'inspection illimités',
                'Personnalisation complète (logo, couleurs)',
                'Templates de rapports professionnels',
                'Export PDF haute qualité',
                'Historique complet',
                'Support prioritaire',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-indigo-600">9€</span>
              <span className="text-gray-500">/mois</span>
              <p className="text-xs text-gray-400 mt-1">Sans engagement — annulable à tout moment</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPaywall(false); setPendingFormData(null); }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Plus tard
              </button>
              <button
                onClick={() => router.push('/abonnement-particulier')}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                S'abonner — 9€/mois
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
  