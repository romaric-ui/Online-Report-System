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

  // Palette: conserver uniquement la couleur pour la ligne de pied de page
  const primaryColor = [0, 119, 182];

  // Helper: déduire le format d'image depuis un data URL
  const inferImageFormat = (dataUrl) => {
    try {
      const head = (dataUrl || '').slice(0, 64).toLowerCase();
      if (head.includes('image/png')) return 'PNG';
      if (head.includes('image/jpeg') || head.includes('image/jpg')) return 'JPEG';
    } catch {}
    return 'JPEG';
  };

  // Helper: couper un texte par longueur de caractères max (sans casser les mots si possible)
  const wrapTextByChars = (text, maxChars = 60) => {
    const words = (text || '').toString().split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const candidate = line ? line + ' ' + w : w;
      if (candidate.length > maxChars) {
        if (line) {
          lines.push(line);
          line = w;
        } else {
          // mot plus long que la limite: couper brutalement
          lines.push(candidate.slice(0, maxChars));
          line = candidate.slice(maxChars);
        }
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

    // Logo centré en haut de page
    if (logoBase64) {
      const coverLogoW = 40;
      const coverLogoH = 20;
      const coverLogoX = (pageWidth - coverLogoW) / 2;
      doc.addImage(logoBase64, 'JPEG', coverLogoX, 12, coverLogoW, coverLogoH);
    }

  // Informations entreprise (en bleu à droite)
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  const companyInfoX = pageWidth - margin;
  doc.setFont(undefined, 'bold');
  doc.text('SGTEC', companyInfoX, 40, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text('Consultant indépendant en Maîtrise d’œuvre', companyInfoX, 45, { align: 'right' });
  doc.text('Rue premier 78005 Paris.', companyInfoX, 50, { align: 'right' });

    // Titre centré de la page de garde
    const titleY = 70;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    const coverTitle = report.chantier || 'Rapport d’intervention';
    doc.text(coverTitle, pageWidth / 2, titleY, { align: 'center' });

    // Bloc d'informations à gauche (même interligne, sous le logo / sous infos entreprise)
  const leftInfoX = margin;
  let leftInfoY = 75; // descendu légèrement plus bas
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
    doc.setFont(undefined, 'normal');
    const establishedIso = report.updatedAt || report.createdAt || new Date().toISOString();
    let establishedStr = '';
    try {
      establishedStr = new Date(establishedIso).toLocaleDateString('fr-FR');
    } catch {
      establishedStr = new Date().toLocaleDateString('fr-FR');
    }

  const valueOffset = 35; // léger décalage vers la droite
  // N° affaire
  doc.setFont(undefined, 'bold');
  doc.text('N° Affaire:', leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.noAffaire || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 6;
  // N° Rapport
  doc.setFont(undefined, 'bold');
  doc.text('N° Rapport:', leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.noRapport || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 6;
  // Intervenant
  doc.setFont(undefined, 'bold');
  doc.text('Intervenant:', leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.intervenant || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 6;
  // Date d'Intervention
  doc.setFont(undefined, 'bold');
  doc.text("Date d'Intervention:", leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.dateIntervention || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 6;
  // Rapport établi le
  doc.setFont(undefined, 'bold');
  doc.text('Rapport établi le:', leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(establishedStr, leftInfoX + valueOffset, leftInfoY);
  // Caption sous le bloc gauche (plus bas, en gras, bleu et centré)
  leftInfoY += 15;
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...primaryColor);
  const captionLines = [
    "RAPPORT D'INVESTIGATION AUDIT DE CLOS COUVERT:",
    "INVESTIGATION DE CHANTIER"
  ];
  doc.text(captionLines, pageWidth / 2, leftInfoY, { align: 'center' });
  // Ajuster Y si la légende passe sur plusieurs lignes
  leftInfoY += Math.max(0, (captionLines.length - 1) * 7);
  // Phase centrée sous la légende
  leftInfoY += 12; // descendre légèrement la position de la phase
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...primaryColor);
  const phaseValue = (report.phase && String(report.phase).trim() !== '' ? String(report.phase) : '—');
  doc.text(`Phase: ${phaseValue}`, pageWidth / 2, leftInfoY, { align: 'center' });

    // Informations principales (texte libre, sans fonds)
  const cardY = Math.max(95, leftInfoY + 10);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    const cardContentX = margin;
    let cardContentY = cardY;
    const colWidth = (pageWidth - margin * 2 - 20) / 2;
    // Helper simple
    const addInfoField = (label, value, x, y) => {
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label.toUpperCase(), x, y);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(value || '—', x, y + 12);
    };



    // Informations (à droite) avec libellés et valeurs remplissables
  const baseY = pageHeight - 110; // position de base
  const centreX = pageWidth - margin;
  const labelOffset = 45; // espace entre libellé et valeur (style similaire au bloc gauche)

    // Zone image à gauche du bloc droit
  const imgBoxW = 60;
  const imgBoxH = 40;
  const imgGap = 8;
  const imgBoxX = margin; // totalement à gauche (respecte la marge)
  const imgBoxY = baseY - 2;
    if (report.coverImage) {
      const format = inferImageFormat(report.coverImage);
      try {
        doc.addImage(report.coverImage, format, imgBoxX, imgBoxY, imgBoxW, imgBoxH);
      } catch {
        doc.setDrawColor(0, 0, 0);
        doc.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Image', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2, { align: 'center' });
      }
    } else {
      doc.setDrawColor(0, 0, 0);
      doc.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Image', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2, { align: 'center' });
    }

    // Répartir verticalement les 4 lignes sur la hauteur de la zone image
    const infoPad = 3; // marge interne dans la zone image
    const linesCount = 4;
    const infoStep = (imgBoxH - 2 * infoPad) / (linesCount - 1);
    const y1 = imgBoxY + infoPad + 0 * infoStep;
    const y2 = imgBoxY + infoPad + 1 * infoStep;
    const y3 = imgBoxY + infoPad + 2 * infoStep;
    const y4 = imgBoxY + infoPad + 3 * infoStep;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    // Centre de Travaux
    doc.setFont(undefined, 'bold');
    doc.text('Centre de Travaux:', centreX - labelOffset, y1, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(report.centreTravaux || '—', centreX, y1, { align: 'right' });
    // Maître d’ouvrage
    doc.setFont(undefined, 'bold');
    doc.text("Maître d’ouvrage:", centreX - labelOffset, y2, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(report.maitreOuvrage || '—', centreX, y2, { align: 'right' });
    // Adresse
    doc.setFont(undefined, 'bold');
    doc.text('Adresse:', centreX - labelOffset, y3, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(report.adresseOuvrage || '—', centreX, y3, { align: 'right' });
  // Propriétaire (en vert)
  doc.setTextColor(22, 163, 74); // vert
  doc.setFont(undefined, 'bold');
  doc.text('Propriétaire:', centreX - labelOffset, y4, { align: 'right' });
  doc.setTextColor(22, 163, 74); // vert
  doc.setFont(undefined, 'normal');
  doc.text(report.proprietaire || '—', centreX, y4, { align: 'right' });
  // reset couleur texte
  doc.setTextColor(0, 0, 0);

    // Pied de page élégant
    const footerY = pageHeight - 20;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const coverFooterText = 'Société de Gestion des Travaux et Encadrement de Chantier. 60 rue François Premier 78005 Paris Cedex';
  const coverFooterLines = wrapTextByChars(coverFooterText, 60);
  coverFooterLines.push('Copyright Bureau SGTEC');
  doc.text(coverFooterLines, pageWidth / 2, footerY + 8, { align: 'center' });

    // --- PAGE DE CONTENU ---
    doc.addPage();

    // En-tête de page: logo retiré sur la page de contenu
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
  const headerTitle = report.chantier ? `${report.chantier} - Rapport détaillé` : 'Rapport détaillé';
  doc.text(headerTitle, pageWidth - margin, 20, { align: 'right' });
    
    // (Pas de ligne colorée en tête)

    let currentY = 45;

    // Helper: rendu de texte justifié (approx.)
  const drawJustifiedText = (text, x, y, maxWidth, lineHeight = 5.5) => {
      const paras = (text || '—').toString().split(/\n+/);
      let cursorY = y;
      paras.forEach((para, pIdx) => {
        const lines = doc.splitTextToSize(para, maxWidth);
        lines.forEach((line, idx) => {
          const isLastLine = idx === lines.length - 1;
          if (isLastLine) {
            doc.text(line, x, cursorY);
          } else {
            // Justification: répartir l'espace restant entre les espaces
            const words = line.split(' ');
            if (words.length === 1) {
              doc.text(line, x, cursorY);
            } else {
              const lineWidth = doc.getTextWidth(line);
              const extra = Math.max(0, maxWidth - lineWidth);
              const gaps = words.length - 1;
              const extraPerGap = extra / gaps;
              let cursorX = x;
              for (let i = 0; i < words.length; i++) {
                const w = words[i];
                doc.text(w, cursorX, cursorY);
                if (i < words.length - 1) {
                  const spaceWidth = doc.getTextWidth(' ');
                  cursorX += doc.getTextWidth(w) + spaceWidth + extraPerGap;
                }
              }
            }
          }
          cursorY += lineHeight;
        });
        // petit écart entre paragraphes
        if (pIdx < paras.length - 1) cursorY += lineHeight * 0.5;
      });
      return cursorY;
    };

    // Sections de contenu avec style moderne
    const addModernSection = (title, icon, content, yPosition) => {
      // Titre (noir, sans fond)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(icon, margin, yPosition + 10);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin + 12, yPosition + 10);

      // Contenu (noir) justifié
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const afterY = drawJustifiedText(content, margin, yPosition + 24, pageWidth - (margin * 2), 5);

      // espace après section
      return afterY + 10;
    };

    
  // Sections Observations et Actions retirées

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
    // (Section Météo retirée)

    // Informations complémentaires
    const addInfoBox = (title, content, x, y, width) => {
      // Titres et contenus simples (noir)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, x, y + 10);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      drawJustifiedText(content || '—', x, y + 20, width, 4.5);
    };

    // Ajout de boîtes d'information supplémentaires
  const boxWidth = (pageWidth - margin * 2 - 20) / 2;
  // Section Contraintes particulières et Points de vigilance retirées

    // Pied de page (ligne colorée autorisée)
    const contentFooterY = pageHeight - 20;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, contentFooterY, pageWidth - margin, contentFooterY);
    
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const contentFooterText = 'Sociéte de Gestion des Travaux et Encadrement de Chantier. 60 Rue François Premier 78005 Paris Cedex';
  const contentFooterLines = wrapTextByChars(contentFooterText, 60);
  contentFooterLines.push('Copyright Bureau SGTEC');
  doc.text(contentFooterLines, pageWidth / 2, contentFooterY + 8, { align: 'center' });

    if (opts.save) {
      const filename = `Rapport_${(report.chantier || 'Chantier').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      return;
    }

    return doc.output('blob');
  };

  // (Helper addSection non utilisé supprimé)

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