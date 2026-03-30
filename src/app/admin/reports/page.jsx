'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Filter,
  Search,
  Calendar,
  User,
  TrendingUp,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AdminReportsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [validationModal, setValidationModal] = useState(false);
  const [validationType, setValidationType] = useState('valide');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);
  const [commentaire, setCommentaire] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const reportsPerPage = 10;

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports');
      
      if (response.status === 401) {
        // Non authentifié - rediriger vers la page de connexion
        router.push('/?login=required');
        return;
      }
      
      if (response.status === 403) {
        // Pas les droits admin
        router.push('/');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
      } else {
        console.error('Erreur:', data.error);
      }
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.nom_chantier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.numero_rapport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.createur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.createur_prenom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'tous') {
      filtered = filtered.filter(report => {
        const statut = report.statut || 'en_attente';
        return statut === statusFilter;
      });
    }

    setFilteredReports(filtered);
    setCurrentPage(1);
  };

  const handleValidation = async () => {
    if (!selectedReport) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_rapport: selectedReport.id_rapport,
          statut: validationType,
          commentaire_admin: commentaire
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Mettre à jour la liste
        await fetchReports();
        
        // Fermer le modal
        setValidationModal(false);
        setSelectedReport(null);
        setCommentaire('');
        
        // Notification succès
        alert(`Rapport ${validationType === 'valide' ? 'validé' : 'rejeté'} avec succès!`);
      } else {
        alert('Erreur lors du traitement du rapport');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const openValidationModal = (report, type) => {
    setSelectedReport(report);
    setValidationType(type);
    setValidationModal(true);
  };

  const getStatutBadge = (statut) => {
    const statutActuel = statut || 'en_attente';
    
    const badges = {
      'en_attente': {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        icon: Clock,
        label: 'En attente'
      },
      'valide': {
        bg: 'bg-green-100',
        text: 'text-green-600',
        icon: CheckCircle,
        label: 'Validé'
      },
      'rejete': {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: XCircle,
        label: 'Rejeté'
      }
    };

    const badge = badges[statutActuel];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => !r.statut || r.statut === 'en_attente').length,
    validated: reports.filter(r => r.statut === 'valide').length,
    rejected: reports.filter(r => r.statut === 'rejete').length
  };

  // Pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour au dashboard
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            Gestion des Rapports
          </h1>
          <p className="text-slate-600">Validez ou rejetez les rapports soumis par les utilisateurs</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En attente</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Validés</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.validated}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rejetés</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl">
                <XCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et Recherche */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par chantier, numéro ou créateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="tous">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="valide">Validés</option>
                <option value="rejete">Rejetés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table des rapports */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">N° Rapport</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Chantier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Créateur</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date création</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Statut</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentReports.length > 0 ? (
                  currentReports.map((report) => (
                    <tr key={report.id_rapport} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {report.numero_rapport}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {report.nom_chantier}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {report.createur_prenom} {report.createur_nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {new Date(report.date_creation).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatutBadge(report.statut)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {(!report.statut || report.statut === 'en_attente') && (
                            <>
                              <button
                                onClick={() => openValidationModal(report, 'valide')}
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl transition-colors"
                                title="Valider"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openValidationModal(report, 'rejete')}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                                title="Rejeter"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => router.push(`/dashboard?view=${report.id_rapport}`)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      Aucun rapport trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Affichage {indexOfFirstReport + 1} à {Math.min(indexOfLastReport, filteredReports.length)} sur {filteredReports.length} rapports
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={`page-${i + 1}`}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de validation */}
      {validationModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              {validationType === 'valide' ? (
                <div className="p-3 bg-green-100 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="p-3 bg-red-100 rounded-2xl">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {validationType === 'valide' ? 'Valider' : 'Rejeter'} le rapport
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedReport.nom_chantier}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Commentaire {validationType === 'rejete' && '(obligatoire)'}
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder={`Ajoutez un commentaire pour ${validationType === 'valide' ? 'la validation' : 'le rejet'}...`}
                rows="4"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setValidationModal(false);
                  setSelectedReport(null);
                  setCommentaire('');
                }}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleValidation}
                disabled={processing || (validationType === 'rejete' && !commentaire.trim())}
                className={`flex-1 px-6 py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50 ${
                  validationType === 'valide'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                }`}
              >
                {processing ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
