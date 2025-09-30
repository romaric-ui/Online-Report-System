"use client";
import "./globals.css";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ReportForm from "./components/ReportForm";
import ReportTable from "./components/ReportTable";
import PdfGenerator from "./components/PdfGenerator";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";

export default function Home() {
  const { data: session, status } = useSession();
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

  // États d'authentification
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // Action en attente après connexion
  const [toast, setToast] = useState(null); // Notification toast

  // Charger les rapports depuis MySQL + préférences localStorage
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger rapports depuis API MySQL
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Erreur chargement API');
      const data = await response.json();
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      // Fallback localStorage si API indisponible
      try {
        const savedReports = localStorage.getItem('constructionReports');
        if (savedReports) {
          setReports(JSON.parse(savedReports));
        }
      } catch (e) {
        console.error('Fallback localStorage error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    // Charger rapports depuis MySQL
    fetchReports();
    
    // Charger préférences depuis localStorage
    try {
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

  // Backup localStorage seulement (MySQL est la source principale)
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
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setPendingAction({ type: 'editReport', data: report }); // Stocker l'action avec les données
      setShowAuthModal(true);
      return;
    }
    
    // Exécuter l'action d'édition
    executeEditReport(report);
  };

  const executeEditReport = (report) => {
    setReportToEdit(report);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewReport = () => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setPendingAction('newReport'); // Stocker l'action en attente
      setShowAuthModal(true);
      return;
    }
    
    // Exécuter l'action de création de nouveau rapport
    executeNewReport();
  };

  const executeNewReport = () => {
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

  // Fonctions d'authentification
  const handleLogin = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    
    // Afficher notification de connexion réussie
    setToast({
      message: `Bienvenue ${userData.prenom} ! Connexion réussie.`,
      type: 'success'
    });
    
    // Exécuter l'action en attente après connexion
    if (pendingAction) {
      setTimeout(() => {
        if (pendingAction === 'newReport') {
          executeNewReport();
          setToast({
            message: 'Formulaire de nouveau rapport ouvert !',
            type: 'success'
          });
        } else if (pendingAction.type === 'editReport') {
          executeEditReport(pendingAction.data);
          setToast({
            message: 'Mode édition activé !',
            type: 'success'
          });
        }
        setPendingAction(null); // Réinitialiser l'action en attente
      }, 500); // Délai pour laisser le temps à la première notification
    }
  };

  const handleLogout = () => {
    // Déconnexion côté client uniquement (pas besoin d'API pour JWT simple)
    localStorage.removeItem('user');
    setUser(null);
    setShowForm(false);
    setReportToEdit(null);
    setPendingAction(null); // Réinitialiser les actions en attente
    
    // Notification de déconnexion
    setToast({
      message: "Vous êtes maintenant déconnecté",
      type: "info"
    });
    setTimeout(() => setToast(null), 3000);
  };

  // Sauvegarder les rapports via API MySQL
  const addReport = async (report) => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const now = new Date().toISOString();
    
    // Si on est en mode édition, on met à jour le rapport existant
    if (reportToEdit) {
      const updated = {
        ...reportToEdit,
        ...report,
        updatedAt: now,
        version: (reportToEdit.version || 1) + 1
      };
      await updateReport(updated);
      setReportToEdit(null);
      setShowForm(false);
      return;
    }

    // Sinon on crée un nouveau rapport
    const enriched = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: report.status || 'En cours',
      private: report.private === undefined ? false : !!report.private,
      phase: report.phase || '',
      entreprise: report.entreprise || '',
      attachments: report.attachments || [],
      ...report,
    };

    try {
      // Sauvegarder dans MySQL via API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched)
      });

      if (!response.ok) throw new Error('Erreur sauvegarde');
      
      // Recharger la liste depuis MySQL
      await fetchReports();
      
    } catch (err) {
      console.error('Save error:', err);
      // Fallback localStorage
      setReports(prev => [enriched, ...prev]);
    }

    setShowForm(false);
    setDraft(null);
    localStorage.removeItem('reportDraft');
    setIsDirty(false);
  };

  // Supprimer un rapport via API MySQL
  const deleteReport = async (id) => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur suppression');
      
      // Mise à jour locale immédiate
      setReports(prev => prev.filter(r => r.id !== id));
      
    } catch (err) {
      console.error('Delete error:', err);
      // Fallback localStorage
      const newReports = reports.filter((r) => r.id !== id);
      setReports(newReports);
      localStorage.setItem('constructionReports', JSON.stringify(newReports));
    }
  };

  // Mettre à jour un rapport existant via API MySQL
  const updateReport = async (updated) => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const response = await fetch(`/api/reports/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      
      if (!response.ok) throw new Error('Erreur mise à jour');
      
      // Mise à jour locale immédiate
      setReports(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
      
    } catch (err) {
      console.error('Update error:', err);
      // Fallback localStorage
      const newReports = reports.map(r => r.id === updated.id ? { ...r, ...updated } : r);
      setReports(newReports);
    }
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
        <Header user={user} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />
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
              {/* Indicateur de chargement MySQL */}
              {loading && (
                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-blue-600">Chargement depuis MySQL...</span>
                  </div>
                </div>
              )}
              
              {/* Indicateur d'erreur MySQL */}
              {error && (
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-700">
                    ⚠️ Connexion MySQL indisponible - Mode localStorage activé
                    <button
                      onClick={fetchReports}
                      className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              )}
              
              {!loading && visibleReports.length === 0 ? (
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
              ) : !loading && (
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
        
        {/* Modal d'authentification */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingAction(null); // Réinitialiser l'action en attente si l'utilisateur ferme la modal
          }}
          onLogin={handleLogin}
        />
        
        {/* Notification Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

