'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Download, Building2, TrendingUp, Wallet, AlertTriangle,
  ChevronRight,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUT_LABELS  = { planifie:'Planifié', en_cours:'En cours', en_pause:'En pause', termine:'Terminé', annule:'Annulé' };
const STATUT_CLASSES = {
  planifie:  'bg-blue-100 text-blue-700',
  en_cours:  'bg-emerald-100 text-emerald-700',
  en_pause:  'bg-yellow-100 text-yellow-700',
  termine:   'bg-slate-100 text-slate-600',
  annule:    'bg-red-100 text-red-600',
};
const URGENCE_CLASSES = {
  rouge:  'bg-red-50 border-red-200 text-red-700 border-l-red-500',
  orange: 'bg-orange-50 border-orange-200 text-orange-700 border-l-orange-400',
};

function fmtCurrency(n) {
  if (!n) return '—';
  return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long' });
}

// ─── Génération PDF ───────────────────────────────────────────────────────────

async function genererPDFHebdo(data) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const dateGen = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

  const addFooter = () => {
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} / ${pages}`, W / 2, H - 6, { align: 'center' });
      doc.text('SGTEC — Résumé hebdomadaire', 14, H - 6);
      doc.text(dateGen, W - 14, H - 6, { align: 'right' });
      doc.setTextColor(0);
    }
  };

  // ── EN-TÊTE ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, W, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉSUMÉ HEBDOMADAIRE', W / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.entreprise_nom || '', W / 2, 27, { align: 'center' });
  doc.setFontSize(9);
  doc.text(
    `Semaine du ${fmtDate(data.periode?.debut)} au ${fmtDate(data.periode?.fin)}`,
    W / 2, 36, { align: 'center' }
  );
  doc.setTextColor(0);

  let y = 55;

  // ── RÉSUMÉ GLOBAL ──
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Résumé global', 14, y);
  doc.setTextColor(0);
  y += 2;

  const r = data.resume || {};
  autoTable(doc, {
    startY: y,
    head: [['Chantiers actifs', 'Progression moy.', 'Budget total', 'Dépenses', 'Incidents semaine']],
    body: [[
      r.chantiers_actifs ?? 0,
      `${r.progression_moyenne ?? 0}%`,
      fmtCurrency(r.budget_total),
      fmtCurrency(r.depense_totale),
      r.incidents_semaine ?? 0,
    ]],
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── CHANTIERS ──
  if (data.chantiers?.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Chantiers en cours', 14, y);
    doc.setTextColor(0);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Chantier', 'Statut', 'Progression', 'Budget consommé']],
      body: data.chantiers.map(c => {
        const depPct = c.budget_prevu > 0
          ? `${Math.round((parseFloat(c.total_depense) / parseFloat(c.budget_prevu)) * 100)}%`
          : '—';
        return [
          c.nom + (c.reference ? ` (${c.reference})` : ''),
          STATUT_LABELS[c.statut] || c.statut,
          `${Math.round(parseFloat(c.progression) || 0)}%`,
          depPct,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── ALERTES ──
  if (data.alertes?.length > 0) {
    if (y > H - 60) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('Alertes', 14, y);
    doc.setTextColor(0);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Type', 'Message']],
      body: data.alertes.map(a => [a.type, a.message]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter();
  doc.save(`resume_hebdo_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RapportHebdoPage() {
  const router  = useRouter();
  const { status } = useSession();

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/dashboard-projet/rapport-hebdo');
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
      await genererPDFHebdo(data);
    } catch (err) {
      setError('Erreur PDF : ' + (err.message || ''));
    } finally {
      setPdfLoading(false);
    }
  };

  const periode = data?.periode
    ? `Semaine du ${fmtDate(data.periode.debut)} au ${fmtDate(data.periode.fin)}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">{periode}</p>
            <h1 className="text-3xl font-bold text-gray-900">Résumé hebdomadaire</h1>
            {data?.entreprise_nom && <p className="mt-1 text-gray-500 text-sm">{data.entreprise_nom}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePDF}
              disabled={pdfLoading || loading || !data}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {pdfLoading ? 'Génération...' : 'Générer le PDF'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard-projet')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Tableau de bord
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 shadow-sm">
            Chargement...
          </div>
        ) : data && (
          <div className="space-y-6">

            {/* ── Cards résumé ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Building2,   bg: 'bg-blue-100 text-blue-600',    label: 'Chantiers actifs',    val: data.resume.chantiers_actifs },
                { icon: TrendingUp,  bg: 'bg-cyan-100 text-cyan-600',    label: 'Progression moyenne', val: `${data.resume.progression_moyenne}%` },
                { icon: Wallet,      bg: 'bg-emerald-100 text-emerald-600', label: 'Dépenses semaine', val: fmtCurrency(data.resume.depense_totale) },
                { icon: AlertTriangle, bg: data.resume.incidents_semaine > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400',
                  label: 'Incidents semaine', val: data.resume.incidents_semaine,
                  alert: data.resume.incidents_semaine > 0 },
              ].map(({ icon: Icon, bg, label, val, alert }) => (
                <div key={label} className={`bg-white rounded-xl border p-5 shadow-sm ${alert ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`rounded-lg p-2 ${bg}`}><Icon className="w-4 h-4" /></div>
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                  </div>
                  <p className={`text-xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{val}</p>
                </div>
              ))}
            </div>

            {/* ── Tableau chantiers ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  Chantiers <span className="text-gray-400 font-normal text-sm">({data.chantiers.length})</span>
                </h2>
              </div>
              {data.chantiers.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">Aucun chantier actif.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chantier</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progression</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dernière activité</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.chantiers.map(c => {
                        const depPct = c.budget_prevu > 0
                          ? Math.round((parseFloat(c.total_depense) / parseFloat(c.budget_prevu)) * 100)
                          : 0;
                        const enRetard = c.date_fin_prevue && new Date(c.date_fin_prevue) < new Date() && !['termine','annule'].includes(c.statut);
                        return (
                          <tr
                            key={c.id_chantier}
                            onClick={() => router.push(`/chantiers/${c.id_chantier}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-gray-900 flex items-center gap-1.5">
                                {c.nom}
                                {enRetard && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />}
                              </p>
                              {c.reference && <p className="text-xs text-gray-400">Réf. {c.reference}</p>}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_CLASSES[c.statut] || 'bg-gray-100 text-gray-600'}`}>
                                {STATUT_LABELS[c.statut] || c.statut}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2 min-w-[80px]">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${Math.min(parseFloat(c.progression)||0,100)}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 w-8 text-right">{Math.round(parseFloat(c.progression)||0)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className={`text-xs font-medium ${depPct >= 90 ? 'text-red-600' : 'text-gray-700'}`}>
                                {depPct > 0 ? `${depPct}%` : '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-gray-400">
                              {c.derniere_activite ? new Date(c.derniere_activite).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td className="px-4 py-3.5">
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Alertes ── */}
            {data.alertes.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">Alertes</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {data.alertes.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {data.alertes.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => router.push(a.lien)}
                      className={`w-full flex items-center gap-3 px-6 py-3.5 text-left hover:brightness-95 transition border-l-4 ${URGENCE_CLASSES[a.urgence] || 'bg-gray-50 border-gray-200 text-gray-700 border-l-gray-300'}`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm flex-1">{a.message}</span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-60" />
                    </button>
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
