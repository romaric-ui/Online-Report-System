'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReportForm from '../../components/ReportForm';

export default function NewReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (session?.user?.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [session, status, router]);

  const addReport = async (formData) => {
    const payload = {
      numero_affaire:   formData.noAffaire       || '',
      numero_rapport:   formData.noRapport        || '',
      nom_chantier:     formData.proprietaire     || '',
      adresse_chantier: formData.adresseOuvrage   || null,
      date_visite:      formData.dateIntervention || null,
      phase:            formData.phase            || null,
      equipe_presente:  formData.intervenants?.length
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

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la création du rapport');
    }

    router.push('/dashboard');
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ReportForm
      addReport={addReport}
      onCancel={() => router.push('/dashboard')}
    />
  );
}
