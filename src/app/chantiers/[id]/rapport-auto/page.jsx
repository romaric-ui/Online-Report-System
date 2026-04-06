'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, FileBarChart, Download, Clock, AlertTriangle,
  Users, Wallet, ShieldCheck, Camera, CheckCircle, Activity,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUT_LABELS  = { planifie:'Planifié', en_cours:'En cours', en_pause:'En pause', termine:'Terminé', annule:'Annulé' };
const STATUT_CLASSES = {
  planifie: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-emerald-100 text-emerald-700',
  en_pause: 'bg-yellow-100 text-yellow-700',
  termine:  'bg-slate-100 text-slate-600',
  annule:   'bg-red-100 text-red-600',
};
const TACHE_STATUT_CLASSES = {
  a_faire:    'bg-slate-100 text-slate-600',
  en_cours:   'bg-blue-100 text-blue-700',
  en_attente: 'bg-yellow-100 text-yellow-700',
  termine:    'bg-emerald-100 text-emerald-700',
};
const TACHE_STATUT_LABELS = { a_faire:'À faire', en_cours:'En cours', en_attente:'En attente', termine:'Terminé' };

function fmtCurrency(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function progressColor(v) {
  if (v >= 75) return 'bg-emerald-500';
  if (v >= 40) return 'bg-blue-500';
  if (v >= 15) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ─── Génération PDF ───────────────────────────────────────────────────────────

async function genererPDF(data) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const dateGeneration = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

  const addFooter = () => {
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} / ${pages}`, W / 2, H - 6, { align: 'center' });
      doc.text('SGTEC — Rapport automatique', 14, H - 6);
      doc.text(dateGeneration, W - 14, H - 6, { align: 'right' });
      doc.setTextColor(0);
    }
  };

  // ── PAGE DE GARDE ──
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, W, 55, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DE CHANTIER', W / 2, 22, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(data.chantier.nom || '', W / 2, 33, { align: 'center' });
  if (data.chantier.reference) {
    doc.setFontSize(10);
    doc.text(`Réf. ${data.chantier.reference}`, W / 2, 41, { align: 'center' });
  }
  doc.setTextColor(0);

  // Infos générales sous l'en-tête
  let y = 65;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Entreprise :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.chantier.entreprise_nom || '—', 50, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Client :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.chantier.client_nom || '—', 50, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text([data.chantier.adresse, data.chantier.ville].filter(Boolean).join(', ') || '—', 50, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Statut :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(STATUT_LABELS[data.chantier.statut] || data.chantier.statut || '—', 50, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Progression :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.round(parseFloat(data.chantier.progression) || 0)}%`, 50, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Période :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Du ${fmtDate(data.chantier.date_debut)} au ${fmtDate(data.chantier.date_fin_prevue)}`, 50, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Date du rapport :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dateGeneration, 50, y);
  y += 12;

  // ── SECTION : JOURNAL ──
  if (data.journal_semaine?.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Journal de la semaine', 14, y);
    doc.setTextColor(0);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Météo', 'Travaux réalisés', 'Problèmes']],
      body: data.journal_semaine.map(j => [
        fmtDate(j.date_journal),
        j.meteo || '—',
        (j.travaux_realises || j.resume || '—').substring(0, 100),
        (j.problemes || '—').substring(0, 80),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── SECTION : TÂCHES ──
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Avancement des tâches', 14, y > H - 40 ? (doc.addPage(), 20) : y);
  y = doc.lastAutoTable?.finalY || y;
  doc.setTextColor(0);
  y += 2;

  const t = data.taches?.stats || {};
  autoTable(doc, {
    startY: y,
    head: [['Total', 'À faire', 'En cours', 'Terminées', 'En retard']],
    body: [[t.total || 0, t.a_faire || 0, t.en_cours || 0, t.terminees || 0, t.en_retard || 0]],
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 4;

  if (data.taches?.liste?.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Tâche', 'Statut', 'Avancement', 'Fin prévue']],
      body: data.taches.liste.map(t => [
        t.nom,
        TACHE_STATUT_LABELS[t.statut] || t.statut,
        `${Math.round(parseFloat(t.pourcentage) || 0)}%`,
        fmtDate(t.date_fin_prevue),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 116, 139] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── SECTION : ÉQUIPE ──
  if (data.equipe?.length > 0) {
    if (y > H - 60) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Équipe & Présences (semaine)', 14, y);
    doc.setTextColor(0);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Prénom', 'Nom', 'Heures cette semaine']],
      body: data.equipe.map(o => [o.prenom, o.nom, `${o.heures_semaine}h`]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [124, 58, 237] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── SECTION : BUDGET ──
  if (y > H - 60) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Budget', 14, y);
  doc.setTextColor(0);
  y += 2;

  const b = data.budget || {};
  autoTable(doc, {
    startY: y,
    head: [['Budget prévu', 'Dépenses validées', 'Reste à dépenser', 'Consommé']],
    body: [[
      fmtCurrency(b.budget_prevu),
      fmtCurrency(b.total_depense),
      fmtCurrency(b.reste),
      `${b.pourcentage || 0}%`,
    ]],
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [5, 150, 105] },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 4;

  if (b.depenses_recentes?.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Description', 'Catégorie', 'Montant', 'Date']],
      body: b.depenses_recentes.map(d => [
        d.description || '—',
        d.categorie || '—',
        fmtCurrency(d.montant),
        fmtDate(d.date_depense),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 116, 139] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── SECTION : SÉCURITÉ ──
  if (y > H - 60) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Sécurité HSE', 14, y);
  doc.setTextColor(0);
  y += 2;

  const s = data.securite || {};
  autoTable(doc, {
    startY: y,
    head: [['Score HSE moyen (mois)', 'Incidents ouverts', 'Dernière checklist']],
    body: [[
      s.score_hse_moyen !== null ? `${s.score_hse_moyen}%` : '—',
      s.incidents_ouverts ?? 0,
      s.derniere_checklist
        ? `${fmtDate(s.derniere_checklist.date_checklist)} — ${s.derniere_checklist.type_checklist}`
        : 'Aucune',
    ]],
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: 14, right: 14 },
  });

  addFooter();

  const slug = (data.chantier.nom || 'chantier').replace(/\s+/g, '_').substring(0, 30);
  doc.save(`rapport_${slug}_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RapportAutoPage({ params: paramsPromise }) {
  const params  = use(paramsPromise);
  const id      = params.id;
  const router  = useRouter();
  const { status } = useSession();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchData();
  }, [status, id]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/chantiers/${id}/rapport-auto`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur de chargement');
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      await genererPDF(data);
    } catch (err) {
      setError('Erreur lors de la génération du PDF : ' + (err.message || ''));
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">

        {/* En-tête */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Rapport de chantier</h1>
            <p className="mt-2 text-slate-500">Vue consolidée des données du chantier pour export PDF.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePDF}
              disabled={pdfLoading || loading || !data}
              className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {pdfLoading ? 'Génération...' : 'Générer le PDF'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/chantiers/${id}`)}
              className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-10 shadow-sm border border-slate-200 text-center text-slate-500">
            Chargement des données...
          </div>
        ) : data && (
          <div className="space-y-6">

            {/* ── Infos générales ── */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md"><FileBarChart className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{data.chantier.nom}</h2>
                  <p className="text-sm text-slate-500">Réf. {data.chantier.reference || '—'} · {data.chantier.entreprise_nom || ''}</p>
                </div>
                <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${STATUT_CLASSES[data.chantier.statut] || 'bg-slate-100 text-slate-600'}`}>
                  {STATUT_LABELS[data.chantier.statut] || data.chantier.statut}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm">
                  <p className="text-slate-500 mb-1">Client</p>
                  <p className="font-semibold text-slate-800">{data.chantier.client_nom || '—'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm">
                  <p className="text-slate-500 mb-1">Adresse</p>
                  <p className="font-semibold text-slate-800">{[data.chantier.adresse, data.chantier.ville].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm">
                  <p className="text-slate-500 mb-1">Dates</p>
                  <p className="font-semibold text-slate-800">{fmtDate(data.chantier.date_debut)} → {fmtDate(data.chantier.date_fin_prevue)}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-slate-600 mb-1.5">
                  <span>Progression globale</span>
                  <span className="font-semibold">{Math.round(parseFloat(data.chantier.progression) || 0)}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${progressColor(parseFloat(data.chantier.progression))}`}
                    style={{ width: `${Math.min(parseFloat(data.chantier.progression) || 0, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* ── Journal ── */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-3xl bg-slate-600 p-3 text-white shadow-md"><Clock className="w-5 h-5" /></div>
                <h2 className="text-xl font-semibold text-slate-900">Journal — 7 derniers jours</h2>
              </div>
              {data.journal_semaine.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucune entrée de journal cette semaine.</p>
              ) : (
                <div className="space-y-3">
                  {data.journal_semaine.map((j, i) => (
                    <div key={i} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-slate-700">{fmtDate(j.date_journal)}</span>
                        {j.meteo && <span className="text-xs text-slate-400">{j.meteo}</span>}
                      </div>
                      {j.travaux_realises && <p className="text-sm text-slate-600">{j.travaux_realises}</p>}
                      {j.problemes && <p className="text-sm text-red-500 mt-1">⚠ {j.problemes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Tâches ── */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-3xl bg-blue-600 p-3 text-white shadow-md"><Activity className="w-5 h-5" /></div>
                <h2 className="text-xl font-semibold text-slate-900">Tâches</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-5 mb-5">
                {[
                  ['Total', data.taches.stats.total, 'bg-slate-100 text-slate-700'],
                  ['À faire', data.taches.stats.a_faire, 'bg-slate-100 text-slate-700'],
                  ['En cours', data.taches.stats.en_cours, 'bg-blue-100 text-blue-700'],
                  ['Terminées', data.taches.stats.terminees, 'bg-emerald-100 text-emerald-700'],
                  ['En retard', data.taches.stats.en_retard, data.taches.stats.en_retard > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'],
                ].map(([label, val, cls]) => (
                  <div key={label} className={`rounded-2xl p-3 text-center ${cls}`}>
                    <p className="text-2xl font-bold">{val}</p>
                    <p className="text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {data.taches.liste.length > 0 && (
                <div className="space-y-2">
                  {data.taches.liste.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2.5">
                      <span className="flex-1 text-sm text-slate-800 font-medium truncate">{t.nom}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${TACHE_STATUT_CLASSES[t.statut] || 'bg-slate-100 text-slate-600'}`}>
                        {TACHE_STATUT_LABELS[t.statut] || t.statut}
                      </span>
                      <span className="text-xs text-slate-500 flex-shrink-0 w-10 text-right">{Math.round(parseFloat(t.pourcentage)||0)}%</span>
                      {t.date_fin_prevue && (
                        <span className="text-xs text-slate-400 flex-shrink-0">{fmtDate(t.date_fin_prevue)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Équipe ── */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-3xl bg-violet-600 p-3 text-white shadow-md"><Users className="w-5 h-5" /></div>
                <h2 className="text-xl font-semibold text-slate-900">Équipe cette semaine</h2>
              </div>
              {data.equipe.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucun ouvrier affecté.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.equipe.map((o, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{o.prenom} {o.nom}</span>
                      <span className="text-sm text-slate-500">{o.heures_semaine}h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Budget ── */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-3xl bg-emerald-500 p-3 text-white shadow-md"><Wallet className="w-5 h-5" /></div>
                <h2 className="text-xl font-semibold text-slate-900">Budget</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-5">
                {[
                  ['Budget prévu', fmtCurrency(data.budget.budget_prevu), 'bg-slate-50'],
                  ['Dépenses validées', fmtCurrency(data.budget.total_depense), data.budget.pourcentage >= 90 ? 'bg-red-50' : 'bg-slate-50'],
                  ['Reste', fmtCurrency(data.budget.reste), 'bg-slate-50'],
                ].map(([label, val, bg]) => (
                  <div key={label} className={`rounded-2xl border border-slate-100 p-5 text-center ${bg}`}>
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-slate-900">{val}</p>
                  </div>
                ))}
              </div>
              {data.budget.pourcentage > 0 && (
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-1.5">
                    <span>Consommé</span>
                    <span className={`font-semibold ${data.budget.pourcentage >= 100 ? 'text-red-600' : data.budget.pourcentage >= 80 ? 'text-orange-500' : 'text-emerald-600'}`}>
                      {data.budget.pourcentage}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${data.budget.pourcentage >= 100 ? 'bg-red-500' : data.budget.pourcentage >= 80 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(data.budget.pourcentage, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Sécurité ── */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-3xl bg-red-500 p-3 text-white shadow-md"><ShieldCheck className="w-5 h-5" /></div>
                <h2 className="text-xl font-semibold text-slate-900">Sécurité HSE</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                  <p className="text-xs text-slate-500 mb-1">Score HSE moyen (mois)</p>
                  <p className={`text-2xl font-bold ${data.securite.score_hse_moyen === null ? 'text-slate-400' : data.securite.score_hse_moyen >= 80 ? 'text-emerald-600' : data.securite.score_hse_moyen >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                    {data.securite.score_hse_moyen !== null ? `${data.securite.score_hse_moyen}%` : '—'}
                  </p>
                </div>
                <div className={`rounded-2xl border p-5 text-center ${data.securite.incidents_ouverts > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-xs text-slate-500 mb-1">Incidents ouverts</p>
                  <p className={`text-2xl font-bold ${data.securite.incidents_ouverts > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {data.securite.incidents_ouverts}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                  <p className="text-xs text-slate-500 mb-1">Dernière checklist</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {data.securite.derniere_checklist
                      ? `${fmtDate(data.securite.derniere_checklist.date_checklist)}`
                      : 'Aucune'}
                  </p>
                  {data.securite.derniere_checklist && (
                    <span className={`text-xs rounded-full px-2 py-0.5 mt-1 inline-block font-semibold ${
                      data.securite.derniere_checklist.statut === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                      data.securite.derniere_checklist.statut === 'non_conforme' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'}`}>
                      {data.securite.derniere_checklist.statut}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Photos ── */}
            {data.photos_recentes.length > 0 && (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-3xl bg-amber-500 p-3 text-white shadow-md"><Camera className="w-5 h-5" /></div>
                  <h2 className="text-xl font-semibold text-slate-900">Photos récentes ({data.photos_recentes.length})</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {data.photos_recentes.map((p, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img
                        src={p.url}
                        alt={p.legende || `Photo ${i+1}`}
                        className="w-full h-24 object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      {p.legende && <p className="text-xs text-slate-500 p-2 truncate">{p.legende}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
