'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, Eye, Download, Edit2, Trash2,
  Calendar, Clock, User, Building, Search, Filter,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  AlertCircle, BarChart3, TrendingUp, Lock, Zap,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limiteInfo, setLimiteInfo] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(6);

  // Recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  // Modales
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    if (status === 'authenticated') {
      if (session?.user?.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      if (session?.user?.roleEntreprise === 1) {
        router.push('/dashboard-projet');
        return;
      }
      fetchReports();
      if (!session?.user?.entrepriseId) {
        fetchLimite();
      }
    }
  }, [status, router, session]);

  useEffect(() => {
    let filtered = [...reports];
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.nom_chantier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.numero_affaire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.numero_rapport?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.statut === statusFilter);
    }
    switch (sortBy) {
      case 'date_desc': filtered.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation)); break;
      case 'date_asc': filtered.sort((a, b) => new Date(a.date_creation) - new Date(b.date_creation)); break;
      case 'name_asc': filtered.sort((a, b) => (a.nom_chantier || '').localeCompare(b.nom_chantier || '')); break;
      case 'name_desc': filtered.sort((a, b) => (b.nom_chantier || '').localeCompare(a.nom_chantier || '')); break;
    }
    setFilteredReports(filtered);
    setCurrentPage(1);
  }, [reports, searchTerm, statusFilter, sortBy]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const fetchLimite = async () => {
    try {
      const res = await fetch('/api/reports/check-limite');
      const json = await res.json();
      if (json.success) setLimiteInfo(json.data);
    } catch {}
  };

  const handleNouveauRapport = () => {
    if (limiteInfo?.limite_atteinte) {
      setShowPaywall(true);
      return;
    }
    router.push('/reports/new');
  };

  // Pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = {
    total: reports.length,
    enAttente: reports.filter(r => r.statut === 'en_attente').length,
    valides: reports.filter(r => r.statut === 'valide').length,
    rejetes: reports.filter(r => r.statut === 'rejete').length,
  };

  const handleView = (report) => router.push(`/?view=${report.id_rapport}`);
  const handleEdit = (report) => router.push(`/?edit=${report.id_rapport}`);
  const handleDelete = (report) => { setSelectedReport(report); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/reports/${selectedReport.id_rapport}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur suppression');
      await fetchReports();
      setShowDeleteModal(false);
      setSelectedReport(null);
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'valide': return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
          <CheckCircle className="w-3 h-3" />Valide
        </span>
      );
      case 'en_attente': return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
          <Clock className="w-3 h-3" />En attente
        </span>
      );
      case 'rejete': return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" />Rejeté
        </span>
      );
      default: return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          <AlertCircle className="w-3 h-3" />Brouillon
        </span>
      );
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Bannière limite gratuite */}
        {limiteInfo && !limiteInfo.is_abonne && (
          <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 ${limiteInfo.limite_atteinte ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-center gap-3">
              {limiteInfo.limite_atteinte
                ? <Lock className="w-5 h-5 text-red-500 shrink-0" />
                : <Zap className="w-5 h-5 text-blue-500 shrink-0" />
              }
              <div>
                {limiteInfo.limite_atteinte ? (
                  <>
                    <p className="font-semibold text-red-700">Limite gratuite atteinte</p>
                    <p className="text-sm text-red-600">Vous avez utilisé votre rapport gratuit. Passez au plan Pro pour créer des rapports illimités.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-blue-700">Plan gratuit — {1 - (limiteInfo.nb_rapports || 0)} rapport restant</p>
                    <p className="text-sm text-blue-600">Passez au plan Pro pour des rapports illimités et des fonctionnalités avancées.</p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              Passer au Pro
            </button>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Rapports', value: stats.total, icon: FileText, color: 'blue' },
            { label: 'En Attente', value: stats.enAttente, icon: Clock, color: 'orange' },
            { label: 'Validés', value: stats.valides, icon: CheckCircle, color: 'green' },
            { label: 'Rejetés', value: stats.rejetes, icon: XCircle, color: 'red' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-2xl flex items-center justify-center shadow-md`}>
                  <Icon className={`w-7 h-7 text-${color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barre d'actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <button
              onClick={handleNouveauRapport}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                limiteInfo?.limite_atteinte
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl'
              }`}
            >
              {limiteInfo?.limite_atteinte ? <Lock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {limiteInfo?.limite_atteinte ? 'Limite atteinte' : 'Nouveau Rapport'}
            </button>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="valide">Validés</option>
                <option value="rejete">Rejetés</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="date_desc">Plus récents</option>
                <option value="date_asc">Plus anciens</option>
                <option value="name_asc">Nom A-Z</option>
                <option value="name_desc">Nom Z-A</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold text-blue-600">{filteredReports.length}</span> rapport(s) trouvé(s)
          </div>
        </div>

        {/* Liste des rapports */}
        {currentReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun rapport trouvé</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre premier rapport</p>
            {!limiteInfo?.limite_atteinte && (
              <button onClick={handleNouveauRapport}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all">
                <Plus className="w-5 h-5" />Créer un rapport
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentReports.map((report) => (
                <div key={report.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 truncate max-w-[150px]">{report.nom_chantier}</h3>
                        <p className="text-xs text-gray-500">N° {report.numero_rapport}</p>
                      </div>
                    </div>
                    {getStatusBadge(report.statut)}
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{report.adresse_chantier}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(report.date_visite).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Créé le {new Date(report.date_creation).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button onClick={() => handleView(report)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-all">
                      <Eye className="w-4 h-4" />Voir
                    </button>
                    <button onClick={() => handleEdit(report)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-medium transition-all">
                      <Edit2 className="w-4 h-4" />Modifier
                    </button>
                    <button onClick={() => handleDelete(report)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="w-4 h-4" />Précédent
                  </button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, index) => (
                      <button key={`page-${index + 1}`} onClick={() => paginate(index + 1)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${currentPage === index + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    Suivant<ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Paywall */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Passez au plan Pro</h3>
              <p className="text-gray-500">Débloquez des rapports illimités et toutes les fonctionnalités avancées.</p>
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
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPaywall(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
                Plus tard
              </button>
              <button onClick={() => router.push('/abonnement-particulier')}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {showDeleteModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-6">
                Voulez-vous vraiment supprimer le rapport <br />
                <span className="font-semibold">{selectedReport.nom_chantier}</span> ?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all">
                Annuler
              </button>
              <button onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}