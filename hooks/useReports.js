// hooks/useReports.js - Hook personnalisé pour gérer les rapports avec API
import { useState, useEffect } from 'react';

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les rapports depuis l'API
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
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

  // Ajouter un rapport
  const addReport = async (reportData) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) throw new Error('Erreur création');
      
      // Recharger la liste
      await fetchReports();
      return { success: true };
      
    } catch (err) {
      console.error('Add error:', err);
      // Fallback localStorage
      setReports(prev => [reportData, ...prev]);
      return { success: false, error: err.message };
    }
  };

  // Mettre à jour un rapport
  const updateReport = async (id, reportData) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) throw new Error('Erreur mise à jour');
      
      // Mise à jour locale immédiate
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...reportData } : r));
      return { success: true };
      
    } catch (err) {
      console.error('Update error:', err);
      // Fallback localStorage
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...reportData } : r));
      return { success: false, error: err.message };
    }
  };

  // Supprimer un rapport
  const deleteReport = async (id) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur suppression');
      
      // Suppression locale immédiate
      setReports(prev => prev.filter(r => r.id !== id));
      return { success: true };
      
    } catch (err) {
      console.error('Delete error:', err);
      // Fallback localStorage
      setReports(prev => prev.filter(r => r.id !== id));
      return { success: false, error: err.message };
    }
  };

  // Charger au montage
  useEffect(() => {
    fetchReports();
  }, []);

  // Sync localStorage en backup
  useEffect(() => {
    try {
      localStorage.setItem('constructionReports', JSON.stringify(reports));
    } catch (e) {
      console.error('LocalStorage sync error:', e);
    }
  }, [reports]);

  return {
    reports,
    loading,
    error,
    addReport,
    updateReport,
    deleteReport,
    refetch: fetchReports
  };
}