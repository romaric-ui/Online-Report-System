"use client";
import "./globals.css";
import { useState, useEffect } from "react";
import ReportForm from "./components/ReportForm";
import ReportCard from "./components/ReportCard";
import Header from "./components/Header";

export default function Home() {
  const [reports, setReports] = useState([]);
  const [reportToEdit, setReportToEdit] = useState(null);

  // Charger les rapports depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedReports = localStorage.getItem('constructionReports');
      if (savedReports) {
        setReports(JSON.parse(savedReports));
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

  const generateId = () => `rpt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // Mode édition : ouvre un rapport dans le formulaire
  const handleEditReport = (report) => {
    setReportToEdit(report);
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
      return;
    }

    // Sinon on crée un nouveau rapport
    const enriched = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: 'draft',
  private: report.private === undefined ? false : !!report.private,
      // standardiser les clefs attendues
      chantier: report.chantier || '',
  phase: report.phase || '',
      
     
  // localisation retirée
      entreprise: report.entreprise || '',
      attachments: report.attachments || [],
      ...report,
    };
    setReports(prev => [enriched, ...prev]);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="app-container">
        <Header />
        <main>
          <h2 className="text-2xl font-semibold mb-4">Tableau de bord</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <ReportForm 
                addReport={addReport} 
                reportToEdit={reportToEdit}
                onCancel={() => setReportToEdit(null)}
              />
            </div>

            <div className="flex flex-col gap-4">
              {reports.filter(r => !r.private).length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Aucun rapport disponible</p>
                </div>
              ) : (
                reports.filter(r => !r.private).map((report) => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    onDelete={() => deleteReport(report.id)}
                    onUpdate={(r) => updateReport(r)}
                    onEditReport={handleEditReport}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

