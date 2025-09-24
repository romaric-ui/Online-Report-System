"use client";
import "./globals.css";
import { useState, useEffect, useRef } from "react";
import ReportForm from "./components/ReportForm";
import ReportTable from "./components/ReportTable";
import PdfGenerator from "./components/PdfGenerator";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";

export default function Home() {
  const [reports, setReports] = useState([]);
  const [reportToEdit, setReportToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false); // formulaire masqué par défaut
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pdfDrawerReport, setPdfDrawerReport] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const autosaveTimer = useRef(null);

  // Charger les rapports + préférences depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedReports = localStorage.getItem('constructionReports');
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      }
      const savedFilter = localStorage.getItem('reportStatusFilter');
      if (savedFilter) setStatusFilter(savedFilter);
      const savedSearch = localStorage.getItem('reportSearch');
      if (savedSearch) setSearch(savedSearch);
      const savedDraft = localStorage.getItem('reportDraft');
      if (savedDraft) {
        try { setDraft(JSON.parse(savedDraft)); } catch {}
      }
    } catch (e) {
      console.error('Erreur parsing localStorage', e);
    }
  }, []);

  // Persister automatiquement à chaque modification de `reports`
  useEffect(() => {
    try {
      localStorage.setItem('constructionReports', JSON.stringify(reports));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde dans localStorage', e);
    }
  }, [reports]);

  // Persister préférences filtrage & recherche
  useEffect(()=> { localStorage.setItem('reportStatusFilter', statusFilter); }, [statusFilter]);
  useEffect(()=> { localStorage.setItem('reportSearch', search); }, [search]);

  // Alerte de navigation si modifications non sauvegardées
  useEffect(() => {
    const beforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  const generateId = () => `rpt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // Mode édition : ouvre un rapport dans le formulaire
  const handleEditReport = (report) => {
    setReportToEdit(report);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewReport = () => {
    setReportToEdit(null);
    setFormKey((k) => k + 1);
    setShowForm(true);
    // Recharger un brouillon éventuel
    if (draft) {
      setTimeout(() => {
        const formEl = document.querySelector('form.form-data-entry');
        if (formEl) {
          // rien d'automatique ici; la restauration peut être manuelle selon besoin
        }
      }, 0);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sauvegarder les rapports dans l'état (enrichi)
  const addReport = (report) => {
    const now = new Date().toISOString();
    
    // Si on est en mode édition, on met à jour le rapport existant
    if (reportToEdit) {
      const updated = {
        ...reportToEdit,
        ...report,
        updatedAt: now,
        version: (reportToEdit.version || 1) + 1
      };
      updateReport(updated);
      setReportToEdit(null); // Quitter le mode édition
      setShowForm(false);
      return;
    }

    // Sinon on crée un nouveau rapport
    const enriched = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      // Conserver le statut choisi dans le formulaire (par défaut 'En cours')
      status: report.status || 'En cours',
  private: report.private === undefined ? false : !!report.private,
    // standardiser les clefs attendues
    phase: report.phase || '',
      
      entreprise: report.entreprise || '',
      attachments: report.attachments || [],
      ...report,
    };
    setReports(prev => [enriched, ...prev]);
    setShowForm(false);
    setDraft(null);
    localStorage.removeItem('reportDraft');
    setIsDirty(false);
  };

  // Supprimer un rapport
  const deleteReport = (id) => {
    const newReports = reports.filter((r) => r.id !== id);
    setReports(newReports);
    localStorage.setItem('constructionReports', JSON.stringify(newReports));
  };

  // Mettre à jour un rapport existant (par id)
  const updateReport = (updated) => {
    const newReports = reports.map(r => r.id === updated.id ? { ...r, ...updated } : r);
    setReports(newReports);
  };

  // Gestion état formulaire (auto-save brouillon)
  const handleFormStateChange = (formState) => {
    setIsDirty(true);
    setDraft(formState);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try { localStorage.setItem('reportDraft', JSON.stringify(formState)); } catch {}
    }, 800); // debounce
  };

  const handleCancelForm = () => {
    if (isDirty && !confirm('Des modifications non sauvegardées seront perdues. Continuer ?')) return;
    setReportToEdit(null);
    setShowForm(false);
    setIsDirty(false);
  };

  // Filtrage dérivé
  const visibleReports = reports
    .filter(r => !r.private)
    .filter(r => {
      if (statusFilter !== 'all') {
        return (r.status || '').toLowerCase() === statusFilter.toLowerCase();
      }
      return true;
    })
    .filter(r => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (r.entreprise || '').toLowerCase().includes(q) ||
        (r.phase || '').toLowerCase().includes(q) ||
        (r.reference || '').toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="app-container">
  <Header />
        <main>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-2xl font-semibold">Tableau de bord</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setReportToEdit(null); window.scrollTo({ top:0, behavior:'smooth'}); }}
                className={`px-4 py-2 rounded text-sm font-medium border transition ${!showForm ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >Voir rapports <span className="ml-1 inline-block px-2 py-0.5 text-[10px] rounded-full bg-gray-200 text-gray-600">{reports.length}</span></button>
              <button
                type="button"
                onClick={handleNewReport}
                className={`px-4 py-2 rounded text-sm font-medium border transition ${showForm ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >Nouveau rapport</button>
              {isDirty && showForm && (
                <span className="text-xs text-amber-600 font-medium self-center">Brouillon non sauvegardé…</span>
              )}
            </div>
          </div>
          <StatsBar reports={reports} />

          {/* Filtres & recherche */}
          <div className="mt-4 mb-6 grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Rechercher (entreprise, phase, référence)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="En attente">En attente</option>
              </select>
            </div>
          </div>
          <div className="grid gap-6">
            {showForm && (
              <div className="card">
                <ReportForm 
                  key={formKey}
                  addReport={addReport} 
                  reportToEdit={reportToEdit}
                  onCancel={handleCancelForm}
                  onFormStateChange={handleFormStateChange}
                />
              </div>
            )}
            {!showForm && (
            <div className="flex flex-col gap-4">
              {visibleReports.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  {reports.filter(r => !r.private).length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-gray-500">Aucun rapport pour le moment.</p>
                      <button
                        onClick={handleNewReport}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm"
                      >Créer un premier rapport</button>
                    </div>
                  ) : <p className="text-gray-500">Aucun résultat pour ces filtres.</p>}
                </div>
              ) : (
                <ReportTable 
                  reports={visibleReports}
                  onDelete={(id)=> deleteReport(id)}
                  onUpdate={(r)=> updateReport(r)}
                  onEditReport={handleEditReport}
                  onOpenPdf={(r)=> setPdfDrawerReport(r)}
                />
              )}
            </div>
            )}
          </div>
        </main>
        {pdfDrawerReport && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={()=>setPdfDrawerReport(null)} />
            <div className="w-full max-w-md md:max-w-lg lg:max-w-xl h-full bg-white shadow-xl border-l flex flex-col animate-fade-in-up">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Génération PDF</h3>
                <button onClick={()=>setPdfDrawerReport(null)} className="text-gray-500 hover:text-gray-700 text-sm">Fermer</button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <PdfGenerator 
                  report={pdfDrawerReport} 
                  onSavePdf={(dataUrl) => { 
                    updateReport({ ...pdfDrawerReport, pdfDataUrl: dataUrl, updatedAt: new Date().toISOString() });
                    setPdfDrawerReport(prev => ({ ...prev, pdfDataUrl: dataUrl }));
                  }}
                  onEditReport={(r)=> { setPdfDrawerReport(null); handleEditReport(r); }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

