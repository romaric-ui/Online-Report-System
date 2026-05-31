'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, FileBarChart, Download, Clock,
  Users, Wallet, ShieldCheck, Camera, Activity, Calendar, Loader2,
} from 'lucide-react';

const STATUT_LABELS  = { planifie:'Planifié', en_cours:'En cours', en_pause:'En pause', termine:'Terminé', annule:'Annulé' };
const STATUT_CLASSES = {
  planifie: 'bg-blue-100 text-blue-700', en_cours: 'bg-emerald-100 text-emerald-700',
  en_pause: 'bg-yellow-100 text-yellow-700', termine: 'bg-slate-100 text-slate-600', annule: 'bg-red-100 text-red-600',
};
const TACHE_STATUT_CLASSES = {
  a_faire: 'bg-slate-100 text-slate-600', en_cours: 'bg-blue-100 text-blue-700',
  en_attente: 'bg-yellow-100 text-yellow-700', termine: 'bg-emerald-100 text-emerald-700',
};
const TACHE_STATUT_LABELS = { a_faire:'À faire', en_cours:'En cours', en_attente:'En attente', termine:'Terminé' };

function fmtCurrency(n) {
  if (!n && n !== 0) return '—';
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
function hexToRgb(hex) {
  const h = (hex || '#2563eb').replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

async function genererPDF(data, dateDebut, dateFin, branding, sections) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const couleur = branding.couleur_principale || '#2563eb';
  const rgb = hexToRgb(couleur);
  const nomEntreprise = branding.nom || data.chantier.entreprise_nom || 'Mon Entreprise';
  const piedPage = branding.pied_page_rapport || `${nomEntreprise} — Rapport automatique`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const dateGeneration = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

  const addFooter = () => {
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`Page ${i} / ${pages}`, W / 2, H - 6, { align: 'center' });
      doc.text(piedPage, 14, H - 6);
      doc.text(dateGeneration, W - 14, H - 6, { align: 'right' });
      doc.setTextColor(0);
    }
  };

  // PAGE DE GARDE
  doc.setFillColor(...rgb);
  doc.rect(0, 0, W, 55, 'F');
  if (branding.logo_url) {
    try { doc.addImage(branding.logo_url, 'PNG', 14, 8, 30, 15); } catch {}
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DE CHANTIER', W / 2, 22, { align: 'center' });
  doc.setFontSize(13); doc.setFont('helvetica', 'normal');
  doc.text(data.chantier.nom || '', W / 2, 33, { align: 'center' });
  doc.setFontSize(10); doc.setTextColor(200, 220, 255);
  doc.text(`Période : ${fmtDate(dateDebut)} → ${fmtDate(dateFin)}`, W / 2, 43, { align: 'center' });
  doc.text(nomEntreprise, W / 2, 50, { align: 'center' });
  doc.setTextColor(0);

  let y = 65;
  const infoLine = (label, val) => {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(label + ' :', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val || '—'), 55, y);
    y += 7;
  };
  infoLine('Entreprise', nomEntreprise);
  infoLine('Client', data.chantier.client_nom);
  infoLine('Adresse', [data.chantier.adresse, data.chantier.ville].filter(Boolean).join(', '));
  infoLine('Statut', STATUT_LABELS[data.chantier.statut] || data.chantier.statut);
  infoLine('Progression', `${Math.round(parseFloat(data.chantier.progression) || 0)}%`);
  infoLine('Période rapport', `${fmtDate(dateDebut)} → ${fmtDate(dateFin)}`);
  infoLine('Date génération', dateGeneration);
  y += 5;

  const sectionTitle = (title) => {
    if (y > H - 40) { doc.addPage(); y = 20; }
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...rgb);
    doc.text(title, 14, y);
    doc.setTextColor(0); y += 2;
  };

  const journal = data.journal || data.journal_semaine || [];
  if (sections.journal && journal.length > 0) {
    sectionTitle('Journal de chantier');
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Météo', 'Travaux réalisés', 'Problèmes']],
      body: journal.map(j => [fmtDate(j.date_journal), j.meteo||'—', (j.travaux_realises||j.resume||'—').substring(0,100), (j.problemes||'—').substring(0,80)]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: rgb, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (sections.taches) {
    sectionTitle('Avancement des tâches');
    const t = data.taches?.stats || {};
    autoTable(doc, {
      startY: y,
      head: [['Total', 'À faire', 'En cours', 'Terminées', 'En retard']],
      body: [[t.total||0, t.a_faire||0, t.en_cours||0, t.terminees||0, t.en_retard||0]],
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: rgb, textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 4;
    if (data.taches?.liste?.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Tâche', 'Statut', 'Avancement', 'Fin prévue']],
        body: data.taches.liste.map(t => [t.nom, TACHE_STATUT_LABELS[t.statut]||t.statut, `${Math.round(parseFloat(t.pourcentage)||0)}%`, fmtDate(t.date_fin_prevue)]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [100, 116, 139] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }
  }

  const equipe = data.equipe || [];
  if (sections.equipe && equipe.length > 0) {
    sectionTitle('Équipe & Présences');
    autoTable(doc, {
      startY: y,
      head: [['Prénom', 'Nom', 'Jours présents', 'Heures totales']],
      body: equipe.map(o => [o.prenom, o.nom, `${o.jours_presents??0} j`, `${o.heures_periode??o.heures_semaine??0} h`]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [124, 58, 237] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (sections.budget) {
    sectionTitle('Budget');
    const b = data.budget || {};
    autoTable(doc, {
      startY: y,
      head: [['Budget prévu', 'Dépenses validées', 'Reste', 'Consommé']],
      body: [[fmtCurrency(b.budget_prevu), fmtCurrency(b.total_depense), fmtCurrency(b.reste), `${b.pourcentage||0}%`]],
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [5, 150, 105] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 4;
    const depenses = b.depenses || b.depenses_recentes || [];
    if (depenses.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Description', 'Catégorie', 'Montant', 'Date']],
        body: depenses.map(d => [d.description||'—', d.categorie||'—', fmtCurrency(d.montant), fmtDate(d.date_depense)]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [100, 116, 139] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }
  }

  if (sections.securite) {
    sectionTitle('Sécurité HSE');
    const s = data.securite || {};
    const incidents = s.incidents || [];
    autoTable(doc, {
      startY: y,
      head: [['Score HSE moyen', 'Incidents sur la période', 'Dernière checklist']],
      body: [[s.score_hse_moyen !== null ? `${s.score_hse_moyen}%` : '—', incidents.length, s.derniere_checklist ? `${fmtDate(s.derniere_checklist.date_checklist)} — ${s.derniere_checklist.type_checklist}` : 'Aucune']],
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 4;
    if (incidents.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Titre', 'Date', 'Gravité', 'Statut']],
        body: incidents.map(i => [i.titre||'—', fmtDate(i.date_incident), i.gravite||'—', i.statut||'—']),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [100, 116, 139] },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        margin: { left: 14, right: 14 },
      });
    }
  }

  addFooter();
  const slug = (data.chantier.nom || 'chantier').replace(/\s+/g, '_').substring(0, 30);
  doc.save(`rapport_${slug}_${dateDebut}_${dateFin}.pdf`);
}

export default function RapportAutoPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const today    = new Date().toISOString().split('T')[0];
  const il7jours = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(il7jours);
  const [dateFin, setDateFin]     = useState(today);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [branding, setBranding]   = useState({ couleur_principale: '#2563eb', nom: '', logo_url: '', pied_page_rapport: '' });
  const [sections, setSections]   = useState({ journal: true, taches: true, equipe: true, budget: true, securite: true });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated') {
      fetch('/api/parametres')
        .then(r => r.json())
        .then(json => { if (json.success && json.data) setBranding(json.data); })
        .catch(() => {});
    }
  }, [status]);

  const fetchData = useCallback(async () => {
    if (!dateDebut || !dateFin) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res  = await fetch(`/api/chantiers/${id}/rapport-auto?dateDebut=${dateDebut}&dateFin=${dateFin}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur de chargement');
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }, [id, dateDebut, dateFin]);

  const handlePDF = async () => {
    if (!data) return;
    setPdfLoading(true);
    try { await genererPDF(data, dateDebut, dateFin, branding, sections); }
    catch (err) { setError('Erreur PDF : ' + (err.message || '')); }
    finally { setPdfLoading(false); }
  };

  const setRaccourci = (days, month = false) => {
    const fin = new Date();
    const debut = month ? new Date(fin.getFullYear(), fin.getMonth(), 1) : new Date(Date.now() - days * 86400000);
    setDateDebut(debut.toISOString().split('T')[0]);
    setDateFin(fin.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Rapport automatique</h1>
            <p className="mt-2 text-slate-500">Choisissez une période et générez le rapport PDF.</p>
          </div>
          <button onClick={() => router.push(`/chantiers/${id}`)}
            className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        {/* Sélecteur période + sections */}
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-3xl p-3 text-white shadow-md" style={{ background: branding.couleur_principale || '#2563eb' }}>
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Période du rapport</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: '7 derniers jours', days: 7 },
              { label: '30 derniers jours', days: 30 },
              { label: 'Ce mois', month: true },
              { label: '3 derniers mois', days: 90 },
            ].map(({ label, days, month }) => (
              <button key={label} onClick={() => setRaccourci(days, month)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition">
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date de début</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date de fin</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Sections */}
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-600 mb-3">Sections à inclure</p>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'journal', label: 'Journal' },
                { key: 'taches', label: 'Tâches' },
                { key: 'equipe', label: 'Équipe' },
                { key: 'budget', label: 'Budget' },
                { key: 'securite', label: 'Sécurité HSE' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm hover:bg-indigo-50 hover:border-indigo-300 transition">
                  <input type="checkbox" checked={sections[key]}
                    onChange={e => setSections(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600" />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={fetchData} disabled={loading || !dateDebut || !dateFin}
              className="inline-flex items-center gap-2 rounded-3xl px-6 py-3 text-white font-semibold shadow-lg transition disabled:opacity-60"
              style={{ background: branding.couleur_principale || '#2563eb' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
              {loading ? 'Chargement...' : "Générer l'aperçu"}
            </button>
            {data && (
              <button onClick={handlePDF} disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-60">
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {pdfLoading ? 'Génération PDF...' : 'Télécharger le PDF'}
              </button>
            )}
          </div>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

        {data && (
          <div className="space-y-6">

            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-3xl p-3 text-white shadow-md" style={{ background: branding.couleur_principale || '#2563eb' }}><FileBarChart className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{data.chantier.nom}</h2>
                  <p className="text-sm text-slate-500">{branding.nom || data.chantier.entreprise_nom}</p>
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
                  <p className="text-slate-500 mb-1">Dates chantier</p>
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

            {sections.taches && (
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
                        {t.date_fin_prevue && <span className="text-xs text-slate-400 flex-shrink-0">{fmtDate(t.date_fin_prevue)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sections.budget && (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-3xl bg-emerald-500 p-3 text-white shadow-md"><Wallet className="w-5 h-5" /></div>
                  <h2 className="text-xl font-semibold text-slate-900">Budget</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 mb-5">
                  {[
                    ['Budget prévu', fmtCurrency(data.budget.budget_prevu), 'bg-slate-50'],
                    ['Dépensé (période)', fmtCurrency(data.budget.total_depense), data.budget.pourcentage >= 90 ? 'bg-red-50' : 'bg-slate-50'],
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
                      <span>Consommé sur la période</span>
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
            )}

            {sections.equipe && data.equipe.length > 0 && (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-3xl bg-violet-600 p-3 text-white shadow-md"><Users className="w-5 h-5" /></div>
                  <h2 className="text-xl font-semibold text-slate-900">Équipe ({data.equipe.length} membres)</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.equipe.map((o, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{o.prenom} {o.nom}</span>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{o.jours_presents ?? 0} j</span>
                        <span className="font-medium text-violet-600">{o.heures_periode ?? o.heures_semaine ?? 0} h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sections.securite && (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-3xl bg-red-500 p-3 text-white shadow-md"><ShieldCheck className="w-5 h-5" /></div>
                  <h2 className="text-xl font-semibold text-slate-900">Sécurité HSE</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <p className="text-xs text-slate-500 mb-1">Score HSE moyen</p>
                    <p className={`text-2xl font-bold ${data.securite.score_hse_moyen === null ? 'text-slate-400' : data.securite.score_hse_moyen >= 80 ? 'text-emerald-600' : data.securite.score_hse_moyen >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                      {data.securite.score_hse_moyen !== null ? `${data.securite.score_hse_moyen}%` : '—'}
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-5 text-center ${(data.securite.incidents?.length ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-xs text-slate-500 mb-1">Incidents sur la période</p>
                    <p className={`text-2xl font-bold ${(data.securite.incidents?.length ?? 0) > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                      {data.securite.incidents?.length ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                    <p className="text-xs text-slate-500 mb-1">Dernière checklist</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {data.securite.derniere_checklist ? fmtDate(data.securite.derniere_checklist.date_checklist) : 'Aucune'}
                    </p>
                  </div>
                </div>
                {(data.securite.incidents?.length > 0) && (
                  <div className="space-y-2">
                    {data.securite.incidents.map((inc, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-2.5">
                        <span className="flex-1 text-sm text-slate-800 font-medium">{inc.titre || '—'}</span>
                        <span className="text-xs text-slate-500">{fmtDate(inc.date_incident)}</span>
                        <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">{inc.gravite || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sections.journal && (data.journal || data.journal_semaine || []).length > 0 && (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-3xl bg-slate-600 p-3 text-white shadow-md"><Clock className="w-5 h-5" /></div>
                  <h2 className="text-xl font-semibold text-slate-900">Journal de chantier</h2>
                </div>
                <div className="space-y-3">
                  {(data.journal || data.journal_semaine).map((j, i) => (
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
              </div>
            )}

            {(data.photos || data.photos_recentes || []).length > 0 && (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-3xl bg-amber-500 p-3 text-white shadow-md"><Camera className="w-5 h-5" /></div>
                  <h2 className="text-xl font-semibold text-slate-900">Photos ({(data.photos || data.photos_recentes).length})</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {(data.photos || data.photos_recentes).map((p, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={p.url} alt={p.legende || `Photo ${i+1}`} className="w-full h-24 object-cover"
                        onError={e => { e.target.style.display = 'none'; }} />
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