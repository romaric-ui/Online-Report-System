"use client";
// components/PdfGenerator.jsx
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useEffect, useState, useCallback } from "react";
import { 
  FaFileDownload, 
  FaEye, 
  FaEdit, 
  FaSave, 
  FaFilePdf,
  FaSpinner
} from "react-icons/fa";

const generatePDF = (logoBase64, report) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  // ... (rest of PDF generation code)
  return doc;
};

export default function PdfGenerator({ report, onSavePdf, onEditReport }) {
  const [logoBase64, setLogoBase64] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/SGTEC.jpg');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Logo non trouvé:', err);
      }
    };
    loadLogo();
  }, []);

  const generatePDF = (opts = { save: true }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Page dimensions A4 (mm)
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;

    // Couleurs modernes
    const primaryColor = [0, 119, 182]; // Bleu professionnel moderne
    const secondaryColor = [44, 62, 80]; // Gris foncé élégant
    const accentColor = [52, 152, 219]; // Bleu accent
    const successColor = [46, 204, 113]; // Vert pour les statuts positifs
    const warningColor = [241, 196, 15]; // Jaune pour les avertissements
    const lightGray = [245, 247, 250]; // Gris très clair pour les fonds
    const darkGray = [108, 122, 137]; // Gris moyen pour le texte secondaire

    // --- PAGE DE GARDE ---
    // Bannière supérieure
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Logo sur fond blanc avec ombre
    if (logoBase64) {
      // Rectangle blanc pour le logo
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 10, 70, 35, 3, 3, 'F');
      // Logo
      const logoW = 60;
      const logoH = 30;
      doc.addImage(logoBase64, 'JPEG', margin + 5, 12, logoW, logoH);
    }

    // Informations entreprise (alignées à droite dans la bannière)
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    const companyInfoX = pageWidth - margin;
    doc.setFont(undefined, 'bold');
    doc.text('SGTEC - L\'OEIL DU BATIMENT', companyInfoX, 20, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('Rapport de Chantier Digital', companyInfoX, 28, { align: 'right' });
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, companyInfoX, 36, { align: 'right' });

    // Ligne de séparation
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(margin, 50, pageWidth - margin, 50);

    // Titre du projet avec accent visuel
    const titleY = 80;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, titleY - 5, pageWidth - margin, titleY - 5);
    
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(report.chantier || 'RAPPORT DE CHANTIER', pageWidth / 2, titleY, { align: 'center' });
    
    doc.setLineWidth(2);
    doc.line(pageWidth / 2 - 40, titleY + 5, pageWidth / 2 + 40, titleY + 5);

    // Carte d'informations principales avec style moderne
    const cardY = 100;
    const cardHeight = 120;
    
    // Fond de la carte avec ombre
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin - 2, cardY - 2, pageWidth - (margin * 2) + 4, cardHeight + 4, 5, 5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, cardY, pageWidth - (margin * 2), cardHeight, 5, 5, 'F');
    
    // Fond de carte avec ombre
    // Contenu des informations
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...secondaryColor);
    
    const cardContentX = margin + 15;
    let cardContentY = cardY + 15;
    
    // Grille d'informations moderne
    const colWidth = (pageWidth - margin * 2 - 40) / 2;
    
    // Fonction helper pour les champs d'info
    const addInfoField = (label, value, x, y) => {
      doc.setFillColor(...lightGray);
      doc.roundedRect(x - 2, y - 5, colWidth, 25, 2, 2, 'F');
      
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkGray);
      doc.text(label.toUpperCase(), x, y);
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...secondaryColor);
      doc.text(value || '—', x, y + 12);
    };

    // Première ligne
    addInfoField('Projet', report.chantier, cardContentX, cardContentY);
    addInfoField('Adresse du site', report.adresseSite, cardContentX + colWidth + 20, cardContentY);
    cardContentY += 35;
    
    // Deuxième ligne
    addInfoField('Responsable', report.responsable, cardContentX, cardContentY);
    addInfoField('Propriétaire', report.proprietaire, cardContentX + colWidth + 20, cardContentY);
    
    cardContentY += 35;
    
    // Dernière ligne avec période et statut
    const periode = `Du ${report.dateDebut || '—'} au ${report.dateFin || '—'}`;
    addInfoField('Période d\'exécution', periode, cardContentX, cardContentY);
    
    // Statut avec code couleur
    let statusColor = successColor; // Vert par défaut
    if (report.status === 'En cours') statusColor = accentColor;
    if (report.status === 'En attente') statusColor = warningColor;
    
    doc.setFillColor(...statusColor);
    doc.roundedRect(cardContentX + colWidth + 18, cardContentY - 5, colWidth + 4, 25, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('STATUT', cardContentX + colWidth + 20, cardContentY);
    doc.setFontSize(11);
    doc.text(report.status || 'Non défini', cardContentX + colWidth + 20, cardContentY + 12);

    // Le badge de statut a été déplacé vers la section Centre de travaux

    // Informations du centre de travaux
    const centreY = pageHeight - 60;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('CENTRE DE TRAVAUX', margin, centreY);
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.text(report.centreTravaux || 'Centre des Travaux de Douala', margin, centreY + 8);
    doc.text(`Chef Chantier: ${report.chefCentre || 'M. KAMGA KAMGA'}`, margin, centreY + 16);
    
    doc.text(`Statut: ${report.status || 'Non défini'}`, margin, centreY + 32);

    // Pied de page élégant
    const footerY = pageHeight - 20;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Document confidentiel - Usage interne uniquement', margin, footerY + 8);
    doc.text(`Version ${report.version || '1.0'}`, pageWidth - margin, footerY + 8, { align: 'right' });

    // --- PAGE DE CONTENU ---
    doc.addPage();

    // En-tête de page
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', margin, 10, 30, 15);
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`${report.chantier || 'Projet'} - Rapport détaillé`, pageWidth - margin, 20, { align: 'right' });
    
    // Ligne de séparation
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, 30, pageWidth - margin, 30);

    let currentY = 45;

    // Sections de contenu avec style moderne
    const addModernSection = (title, icon, content, yPosition) => {
      // Conteneur de section avec ombre
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin - 2, yPosition - 2, pageWidth - (margin * 2) + 4, 50, 3, 3, 'F');
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 46, 3, 3, 'F');

      // En-tête de section
      doc.setFillColor(...primaryColor);
      doc.roundedRect(margin, yPosition, 40, 16, 3, 3, 'F');
      
      // Icône et titre
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(icon, margin + 6, yPosition + 11);
      
      doc.setTextColor(...primaryColor);
      doc.setFontSize(14);
      doc.text(title, margin + 50, yPosition + 11);

      // Contenu avec mise en forme
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const lines = doc.splitTextToSize(content || '—', pageWidth - (margin * 2) - 20);
      doc.text(lines, margin + 10, yPosition + 25);

      return yPosition + 60; // Retourne la position Y pour la prochaine section
    };

    // Section Avancement avec barre de progression
    currentY = addModernSection('AVANCEMENT', '📊', report.avancement, currentY);
    
    // Section Observations avec icônes pour catégories
    currentY = addModernSection('OBSERVATIONS', '🔍', report.observations, currentY);
    
    // Section Actions avec cases à cocher
    currentY = addModernSection('ACTIONS À SUIVRE', '✓', report.prochainesEtapes, currentY);

    // Section Équipe avec organigramme simplifié
    if (report.equipe) {
      currentY = addModernSection('ÉQUIPE', '👥', report.equipe, currentY);
    }

    // Section Matériel avec catégories
    if (report.materiel) {
      currentY = addModernSection('MATÉRIEL', '🔧', report.materiel, currentY);
    }

    // Section Photos du chantier (si disponible)
    if (report.photos && report.photos.length > 0) {
      currentY = addModernSection('PHOTOS DU CHANTIER', '�', '', currentY);
      // Grille de photos à implémenter
    }
    
    // Section Météo (à implémenter)
    currentY = addModernSection('CONDITIONS MÉTÉO', '🌤️', report.meteo || 'Conditions météorologiques non spécifiées', currentY);

    // Informations complémentaires
    const addInfoBox = (title, content, x, y, width) => {
      doc.setFillColor(...lightGray);
      doc.roundedRect(x - 1, y - 1, width + 2, 60, 3, 3, 'F');
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, width, 58, 3, 3, 'F');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, x + 10, y + 15);

      doc.setTextColor(...secondaryColor);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(content || '—', width - 20);
      doc.text(lines, x + 10, y + 30);
    };

    // Ajout de boîtes d'information supplémentaires
    const boxWidth = (pageWidth - margin * 2 - 20) / 2;
    addInfoBox('CONTRAINTES PARTICULIÈRES', report.contraintes || 'Aucune contrainte particulière signalée', 
              margin, currentY, boxWidth);
    addInfoBox('POINTS DE VIGILANCE', report.vigilance || 'Aucun point de vigilance signalé', 
              margin + boxWidth + 20, currentY, boxWidth);

    // Pied de page
    const contentFooterY = pageHeight - 20;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, contentFooterY, pageWidth - margin, contentFooterY);
    
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footerText = `${report.chantier || 'Rapport'} • ${report.responsable || 'SGTEC'} • ${new Date().toLocaleDateString('fr-FR')}`;
    doc.text(footerText, pageWidth / 2, contentFooterY + 8, { align: 'center' });

    if (opts.save) {
      const filename = `Rapport_${(report.chantier || 'Chantier').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      return;
    }

    return doc.output('blob');
  };

  // Fonction helper pour ajouter une section
  const addSection = (doc, title, icon, content, startY, pageWidth, margin, primaryColor, secondaryColor) => {
    let y = startY;
    
    // Titre de section avec icône et fond
    doc.setFillColor(...primaryColor);
    doc.rect(margin - 3, y - 2, pageWidth - margin * 2 + 6, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${icon} ${title}`, margin, y + 6);
    
    y += 15;
    
    // Contenu sans cadre ni fond
    const contentHeight = Math.ceil((content || 'Non renseigné').length / 100) * 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...secondaryColor);
    
    const text = content || 'Aucune information renseignée pour cette section.';
    const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(splitText, margin, y + 3);
    
    return y + contentHeight + 15;
  };

  const handleAction = async (action) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      switch (action) {
        case 'download':
          await generatePDF({ save: true });
          break;
        case 'preview':
          const blob = await generatePDF({ save: false });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          break;
        case 'save':
          const saveBlob = await generatePDF({ save: false });
          const dataUrl = await blobToDataURL(saveBlob);
          if (onSavePdf) onSavePdf(dataUrl);
          alert('PDF enregistré avec succès !');
          break;
        case 'edit':
          if (onEditReport) {
            onEditReport(report);
          } else {
            alert('Fonction d\'édition non disponible');
          }
          break;
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur s\'est produite lors de l\'opération');
    } finally {
      setIsGenerating(false);
    }
  };

  const blobToDataURL = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <FaFilePdf className="text-red-600 text-lg" />
        <h3 className="font-semibold text-gray-800">Génération PDF</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Télécharger */}
        <button
          onClick={() => handleAction('download')}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          title="Télécharger le rapport PDF"
        >
          {isGenerating ? (
            <FaSpinner className="animate-spin text-sm" />
          ) : (
            <FaFileDownload className="text-sm" />
          )}
          <span className="hidden sm:inline">Télécharger</span>
        </button>

        {/* Aperçu */}
        <button
          onClick={() => handleAction('preview')}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          title="Aperçu du rapport"
        >
          {isGenerating ? (
            <FaSpinner className="animate-spin text-sm" />
          ) : (
            <FaEye className="text-sm" />
          )}
          <span className="hidden sm:inline">Aperçu</span>
        </button>

        {/* Modifier */}
        <button
          onClick={() => handleAction('edit')}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          title="Modifier le rapport"
        >
          <FaEdit className="text-sm" />
          <span className="hidden sm:inline">Modifier</span>
        </button>

        {/* Enregistrer */}
        <button
          onClick={() => handleAction('save')}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          title="Enregistrer dans le rapport"
        >
          {isGenerating ? (
            <FaSpinner className="animate-spin text-sm" />
          ) : (
            <FaSave className="text-sm" />
          )}
          <span className="hidden sm:inline">Enregistrer</span>
        </button>
      </div>

      {/* Informations du rapport */}
      <div className="mt-3 p-3 bg-gray-50 rounded-md">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Projet:</span>
            <span className="font-medium">{report.chantier || 'Non défini'}</span>
          </div>
          <div className="flex justify-between">
            <span>Responsable:</span>
            <span className="font-medium">{report.responsable || 'Non défini'}</span>
          </div>
          <div className="flex justify-between">
            <span>Statut:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              report.status === 'Terminé' ? 'bg-green-100 text-green-800' :
              report.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
              report.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {report.status || 'Non défini'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}