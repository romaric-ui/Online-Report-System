"use client";
import "./globals.css";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import ReportForm from "./components/ReportForm";
import ReportTable from "./components/ReportTable";
import PdfGenerator from "./components/PdfGenerator";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";
import LandingHero from "./components/LandingHero";
import LandingFeatures from "./components/LandingFeatures";
import LandingTestimonials from "./components/LandingTestimonials";
import LandingPricing from "./components/LandingPricing";
import LandingCTA from "./components/LandingCTA";
import LandingFooter from "./components/LandingFooter";

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

  // Charger rapports optimisé avec cache
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚀 Récupération des rapports...');
      
      const startTime = Date.now();
      const response = await fetch('/api/reports', {
        // Optimisations réseau
        cache: 'default',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Erreur chargement API');
      const data = await response.json();
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ ${data.length || 0} rapports chargés en ${loadTime}ms`);
      
      setReports(data);
      setError(null);
      
      // Cache localStorage pour la prochaine visite
      localStorage.setItem('constructionReports', JSON.stringify(data));
      
    } catch (err) {
      console.error('❌ Erreur API:', err.message);
      setError(`Chargement impossible: ${err.message}`);
      
      // Fallback localStorage ultra-rapide
      try {
        const savedReports = localStorage.getItem('constructionReports');
        if (savedReports) {
          const cachedData = JSON.parse(savedReports);
          setReports(cachedData);
          console.log(`📦 ${cachedData.length} rapports chargés depuis le cache`);
          setError('Mode hors ligne - données du cache');
        }
      } catch (e) {
        console.error('❌ Erreur cache:', e);
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  }, []); // useCallback pour éviter les re-renders

  // Synchroniser l'état user avec NextAuth session
  useEffect(() => {
    if (session?.user) {
      console.log('👤 Session utilisateur:', {
        id: session.user.id,
        email: session.user.email,
        nom: session.user.nom,
        isGoogle: session.user.isGoogle
      });
      
      // Mettre à jour l'état local avec les données de session
      const userData = {
        id: session.user.id || session.user.email, // Utiliser l'email comme fallback ID
        email: session.user.email,
        nom: session.user.name || session.user.nom,
        prenom: session.user.prenom || '',
        isGoogle: session.user.isGoogle || true,
        isAuthenticated: true
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ Utilisateur synchronisé:', userData);
    } else if (status === 'unauthenticated') {
      // Nettoyer l'état si pas de session
      setUser(null);
      localStorage.removeItem('user');
      console.log('🚫 Utilisateur déconnecté');
    }
  }, [session, status]);

  useEffect(() => {
    // Chargement différé pour de meilleures performances
    const loadReports = async () => {
      // Charger d'abord depuis le cache pour affichage immédiat
      try {
        const cachedReports = localStorage.getItem('constructionReports');
        if (cachedReports) {
          const data = JSON.parse(cachedReports);
          setReports(data);
          setLoading(false);
          console.log(`⚡ Affichage instantané: ${data.length} rapports (cache)`);
        }
      } catch (e) {
        console.error('Cache non disponible:', e);
      }
      
      // Puis charger les données fraîches en arrière-plan
      setTimeout(() => fetchReports(), 100); // Délai pour UI responsive
    };
    
    loadReports();
    
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

  // Fonction utilitaire pour vérifier l'authentification (NextAuth + état local)
  const isAuthenticated = () => {
    return (session?.user && user) || (status === 'authenticated' && session?.user);
  };

  // Fonction utilitaire pour afficher les toasts
  const showToast = useCallback((toastData) => {
    setToast(toastData);
    // Auto-fermeture après 4 secondes
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fonction pour exiger l'authentification avant une action
  const requireAuth = (action, actionData = null) => {
    if (isAuthenticated()) {
      return true;
    }
    
    console.log('🔐 Authentification requise pour:', action);
    setPendingAction({ type: action, data: actionData });
    setShowAuthModal(true);
    showToast({
      type: 'warning',
      message: 'Veuillez vous connecter pour effectuer cette action'
    });
    return false;
  };

  // Mode édition : ouvre un rapport dans le formulaire
  const handleEditReport = (report) => {
    if (!requireAuth('editReport', report)) return;
    executeEditReport(report);
  };

  const executeEditReport = (report) => {
    setReportToEdit(report);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewReport = () => {
    if (!requireAuth('newReport')) return;
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
    if (!requireAuth('addReport', report)) return;

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
    if (!requireAuth('deleteReport', { id })) return;

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
    if (!requireAuth('updateReport', updated)) return;

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

  // État pour basculer entre landing page et dashboard
  const [showDashboard, setShowDashboard] = useState(false);

  // Si l'utilisateur veut voir le dashboard, afficher le dashboard
  if (showDashboard && isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header user={user} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* En-tête du Dashboard avec gradient */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-2">
                  Bienvenue, {user?.prenom || session?.user?.name?.split(' ')[0] || 'Utilisateur'} 👋
                </h1>
                <p className="text-gray-600 text-lg">
                  Gérez vos rapports de chantier en toute simplicité
                </p>
              </div>
              <button
                type="button"
                onClick={handleNewReport}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau rapport
              </button>
            </div>
          </div>

          {/* Statistiques en Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up animation-delay-100">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{reports.length}</div>
              <p className="text-sm text-gray-600">Rapports créés</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-500">En cours</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {reports.filter(r => r.status?.toLowerCase() === 'en cours').length}
              </div>
              <p className="text-sm text-gray-600">Rapports actifs</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-500">Terminés</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {reports.filter(r => r.status?.toLowerCase() === 'terminé').length}
              </div>
              <p className="text-sm text-gray-600">Rapports complétés</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-500">En attente</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {reports.filter(r => r.status?.toLowerCase() === 'en attente').length}
              </div>
              <p className="text-sm text-gray-600">Rapports en révision</p>
            </div>
          </div>

          {/* Onglets de navigation */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in-up animation-delay-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setReportToEdit(null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    !showForm 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Tous les rapports
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    !showForm ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {reports.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleNewReport}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    showForm 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {reportToEdit ? 'Modifier' : 'Nouveau rapport'}
                </button>
              </div>
              {isDirty && showForm && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Brouillon non sauvegardé</span>
                </div>
              )}
            </div>

            {/* Filtres & recherche modernes */}
            {!showForm && (
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="md:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Rechercher par entreprise, phase, référence..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none shadow-sm"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                      <option value="En attente">En attente</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="animate-fade-in-up animation-delay-300">
            {showForm && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
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
              <div className="flex flex-col gap-6">
                {/* Indicateur de chargement MySQL */}
                {loading && (
                  <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-lg">
                    <div className="inline-flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">Chargement en cours...</p>
                        <p className="text-sm text-gray-600">Récupération de vos rapports depuis MySQL</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Indicateur d'erreur MySQL */}
                {error && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Connexion MySQL indisponible</h3>
                        <p className="text-sm text-gray-700 mb-3">
                          Mode hors ligne activé - Vos données sont chargées depuis le cache local
                        </p>
                        <button
                          onClick={fetchReports}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-sm shadow-md transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Réessayer la connexion
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* État vide élégant */}
                {!loading && visibleReports.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-lg">
                    {reports.filter(r => !r.private).length === 0 ? (
                      <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun rapport pour le moment</h3>
                        <p className="text-gray-600 mb-6">
                          Commencez par créer votre premier rapport de chantier et gérez tous vos projets en un seul endroit.
                        </p>
                        <button
                          onClick={handleNewReport}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Créer mon premier rapport
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
                        <p className="text-gray-600">
                          Essayez de modifier vos filtres ou votre recherche
                        </p>
                      </div>
                    )}
                  </div>
                ) : !loading && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <ReportTable 
                      reports={visibleReports}
                      onDelete={(id)=> deleteReport(id)}
                      onUpdate={(r)=> updateReport(r)}
                      onEditReport={handleEditReport}
                      onOpenPdf={(r)=> setPdfDrawerReport(r)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
            setPendingAction(null);
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
    );
  }

  // Afficher la landing page pour tout le monde (connecté ou non)
  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />
      <LandingHero 
        onGetStarted={() => {
          if (isAuthenticated()) {
            setShowDashboard(true);
          } else {
            setShowAuthModal(true);
          }
        }} 
        isAuthenticated={isAuthenticated()}
      />
      <LandingFeatures />
      {/* Section Témoignages temporairement cachée */}
      {/* <LandingTestimonials /> */}
      {/* Section Pricing temporairement cachée */}
      {/* <LandingPricing 
        onGetStarted={() => {
          if (isAuthenticated()) {
            setShowDashboard(true);
          } else {
            setShowAuthModal(true);
          }
        }}
        isAuthenticated={isAuthenticated()}
      /> */}
      <LandingCTA 
        onGetStarted={() => {
          if (isAuthenticated()) {
            setShowDashboard(true);
          } else {
            setShowAuthModal(true);
          }
        }}
        isAuthenticated={isAuthenticated()}
      />
      <LandingFooter />
      
      {/* Modal d'authentification */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
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
  );
}

