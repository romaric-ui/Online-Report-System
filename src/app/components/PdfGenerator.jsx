"use client";
// components/PdfGenerator.jsx
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [logoDims, setLogoDims] = useState(null); // {w,h} dimensions de l'image chargée
  const [isGenerating, setIsGenerating] = useState(false);
  // Image (logo) associée au badge de phase (reserve / observation / custom)
  const [phaseBadgeImg, setPhaseBadgeImg] = useState('');

  // Chargement du logo d'en-tête (optionnel)
  useEffect(() => {
    const toDataUrl = (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const trimLogoBorders = async (dataUrl) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) return resolve(dataUrl);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, w, h);
          const isBg = (idx) => {
            const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
            return (a < 15) || (r > 235 && g > 235 && b > 235);
          };
          let top = 0, bottom = h - 1, left = 0, right = w - 1;
          scanTop: for (; top < h; top++) {
            for (let x = 0; x < w; x++) {
              const idx = (top * w + x) * 4;
              if (!isBg(idx)) break scanTop;
            }
          }
          scanBottom: for (; bottom >= 0; bottom--) {
            for (let x = 0; x < w; x++) {
              const idx = (bottom * w + x) * 4;
              if (!isBg(idx)) break scanBottom;
            }
          }
          scanLeft: for (; left < w; left++) {
            for (let y = top; y <= bottom; y++) {
              const idx = (y * w + left) * 4;
              if (!isBg(idx)) break scanLeft;
            }
          }
          scanRight: for (; right >= 0; right--) {
            for (let y = top; y <= bottom; y++) {
              const idx = (y * w + right) * 4;
              if (!isBg(idx)) break scanRight;
            }
          }
          if (right <= left || bottom <= top) return resolve(dataUrl);
          const inward = 2;
          left = Math.min(Math.max(0, left + inward), w - 1);
          top = Math.min(Math.max(0, top + inward), h - 1);
          right = Math.max(0, Math.min(w - 1, right - inward));
          bottom = Math.max(0, Math.min(h - 1, bottom - inward));
          if (right <= left || bottom <= top) return resolve(dataUrl);
          const cropW = Math.max(1, right - left + 1);
          const cropH = Math.max(1, bottom - top + 1);
          const out = document.createElement('canvas');
          out.width = cropW;
          out.height = cropH;
          const octx = out.getContext('2d');
          octx.drawImage(img, left, top, cropW, cropH, 0, 0, cropW, cropH);
          resolve(out.toDataURL('image/png'));
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    });

    const loadLogo = async () => {
      // Logo fixe de l'application
      const source = '/logo_couleur.png';
      try {
        if (typeof source === 'string' && source.startsWith('data:image')) {
          const trimmed = await trimLogoBorders(source);
          setLogoBase64(trimmed);
          const img = new Image();
          img.onload = () => setLogoDims({ w: img.naturalWidth, h: img.naturalHeight });
          img.src = trimmed;
          return;
        }
        // fetch du fichier statique
        const res = await fetch(source);
        const blob = await res.blob();
        const dataUrl = await toDataUrl(blob);
        const trimmed = await trimLogoBorders(dataUrl);
        setLogoBase64(trimmed);
        const img = new Image();
        img.onload = () => setLogoDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = trimmed;
      } catch {
        setLogoBase64('');
        setLogoDims(null);
      }
    };
    loadLogo();
  }, []);

  // Chargement image du badge phase (reserve / observation)
  useEffect(() => {
    const loadPhaseBadgeImage = async () => {
      if (!report?.phaseBadgeImage) { setPhaseBadgeImg(''); return; }
      try {
        if (report.phaseBadgeImage.startsWith('data:image') || report.phaseBadgeImage.startsWith('/')) {
          setPhaseBadgeImg(report.phaseBadgeImage);
        } else {
          setPhaseBadgeImg('');
        }
      } catch { setPhaseBadgeImg(''); }
    };
    loadPhaseBadgeImage();
  }, [report?.phaseBadgeImage]);

  const generatePDF = (opts = { save: true }) => {
    // Dimensions A4 (mm)
  const a4Width = 210;
  const a4Height = 297;
  const primaryColor = [14, 78, 173];
    const pageWidth = a4Width;
    const margin = 20;
    // Position de départ du contenu sur les pages de contenu (page 2+)
    const CONTENT_TOP_Y = 35; // remonter un peu le contenu
  // Interligne 2.0
  const PAR_LINE_H = 11; // paragraphe (≈ 2x 5.5)
  const INFO_LINE_H = 9; // lignes info (≈ 2x 4.5)

    // Estimation préalable de la hauteur nécessaire pour la page de garde
    // Reproduit la logique de placement jusqu'à la "Phase" pour obtenir le Y final
  // Point de départ vertical des informations (décalé plus bas)
  const INFO_BASE_Y = 80; // Ajuster ici pour descendre / monter le bloc d'infos
  let estimatedLeftInfoY = INFO_BASE_Y;
    // 5 lignes (Affaire, Rapport, Intervenant, Date, Établi le)
    estimatedLeftInfoY += 6 * 4; // après 4 incréments, la 5e ligne est au même Y
    estimatedLeftInfoY += 15; // espace avant légende
    const estCaptionLines = [
      "RAPPORT D'INVESTIGATION AUDIT DE CLOS COUVERT:",
      "INVESTIGATION DE CHANTIER"
    ];
    estimatedLeftInfoY += Math.max(0, (estCaptionLines.length - 1) * 7);
    estimatedLeftInfoY += 12; // Phase
    const topEndAfterPhase = estimatedLeftInfoY; // Y où la Phase est dessinée

    // Bloc bas (zone image + infos) commence ~ à (pageHeight - 112)
    // On garantit un écart minimal de 10mm entre le haut et ce bloc
    const minGap = 10;
  const coverRequiredHeight = Math.max(a4Height, Math.ceil(topEndAfterPhase + minGap + 112));

    // Créer le document avec une page de garde à hauteur calculée
    const doc = new jsPDF({ unit: 'mm', format: [a4Width, coverRequiredHeight] });
    let pageHeight = coverRequiredHeight;
    // ... le reste de la génération PDF continuera ici (code intact plus bas)
  // (Ne pas fermer generatePDF ici; la fonction se poursuit plus loin)

  // Helper: couper un texte par longueur de caractères max (sans casser les mots si possible)
  const inferImageFormat = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== 'string') return 'PNG';
    if (dataUrl.startsWith('data:image/png')) return 'PNG';
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
    return 'PNG';
  };
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

    // Logo centré en haut de la page de garde (position restaurée)
    if (logoBase64) {
      const maxW = 50;
      const maxH = 25;
      let drawW = maxW;
      let drawH = maxH;
      if (logoDims && logoDims.w > 0 && logoDims.h > 0) {
        const ratio = logoDims.w / logoDims.h;
        // Fit dans le rectangle max en conservant le ratio
        if (drawW / drawH > ratio) {
          // trop large: ajuster largeur selon la hauteur
          drawW = drawH * ratio;
        } else {
          // trop haut: ajuster hauteur selon la largeur
          drawH = drawW / ratio;
        }
      }
      const coverLogoY = 12;
      const coverLogoX = (pageWidth - drawW) / 2;
      const fmt = inferImageFormat(logoBase64);
      try {
        doc.addImage(logoBase64, fmt, coverLogoX, coverLogoY, drawW, drawH);
      } catch (e) {
        try { doc.addImage(logoBase64, 'JPEG', coverLogoX, coverLogoY, drawW, drawH); } catch {}
      }
    }

  // Informations entreprise (droite, descendu, en noir)
  const companyBlockY = 55; // point de départ vertical ajusté
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  const companyInfoX = pageWidth - margin;
  doc.setFont(undefined, 'bold');
  doc.text('SGTEC', companyInfoX, companyBlockY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  doc.text('Consultant indépendant en Maîtrise d’œuvre', companyInfoX, companyBlockY + 5, { align: 'right' });
  doc.text('Rue premier 78005 Paris.', companyInfoX, companyBlockY + 10, { align: 'right' });

  
    const titleY = 70; // conservé pour ne pas perturber le reste de la mise en page

    // Bloc d'informations à gauche (même interligne, sous le logo / sous infos entreprise)
  const leftInfoX = margin;
  let leftInfoY = INFO_BASE_Y; // position de départ ajustée
  doc.setFontSize(12);
  // Champs à gauche (Affaire/Rapport/Intervenant/Date/Établi le) en noir
  doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    const establishedIso = report.updatedAt || report.createdAt || new Date().toISOString();
    let establishedStr = '';
    try {
      establishedStr = new Date(establishedIso).toLocaleDateString('fr-FR');
    } catch {
      establishedStr = new Date().toLocaleDateString('fr-FR');
    }

  const valueOffset = 42; // décalage un peu plus large
  // N° affaire
  doc.setFont(undefined, 'bold');
  doc.text('N° Affaire:', leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.noAffaire || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 9;
  // N° Rapport
  doc.setFont(undefined, 'bold');
  doc.text('N° Rapport:', leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.noRapport || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 9;
  // Intervenant
  doc.setFont(undefined, 'bold');
  doc.text('Intervenant:', leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.intervenant || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 9;
  // Date d'Intervention
  doc.setFont(undefined, 'bold');
  doc.text("Date d'Intervention:", leftInfoX, leftInfoY);
  doc.setFont(undefined, 'normal');
  doc.text(report.dateIntervention || '—', leftInfoX + valueOffset, leftInfoY);
  leftInfoY += 9;
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
  // Affichage de la phase + éventuel badge (phaseBadge choisi dans le formulaire)
  const phaseCenterX = pageWidth / 2;
  const phaseLabel = `Phase: ${phaseValue}`;
  doc.text(phaseLabel, phaseCenterX, leftInfoY, { align: 'center' });
  // Nouveau rendu: badge de phase agrandi et aligné complètement à droite
  if (report.phaseBadge) {
    const imgSize = 20; // taille agrandie
    const rightPadding = 4; // petit espace avec la marge
    const badgeX = pageWidth - margin - imgSize - rightPadding;
    // Affichage image si disponible
    if (phaseBadgeImg) {
      try {
        const badgeYImg = leftInfoY - imgSize + 8; // ajustement vertical (baseline du texte)
        const fmt = phaseBadgeImg.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(phaseBadgeImg, fmt, badgeX, badgeYImg, imgSize, imgSize);
      } catch {
        // en cas d'erreur image → fallback texte stylisé
        doc.setTextColor(0,0,0);
        doc.setFontSize(10);
        doc.text(String(report.phaseBadge).toUpperCase(), badgeX, leftInfoY);
      }
    } else {
      // Fallback texte (pastille stylisée) si aucune image pré‑chargée
      const badgePaddingH = 3;
      const badgePaddingW = 4;
      const badgeText = report.phaseBadge === 'reserve' ? 'RÉSERVÉ' : (report.phaseBadge === 'observation' ? 'AVEC OBSERVATION' : String(report.phaseBadge));
      let fill = [240,240,240];
      let stroke = [200,200,200];
      let textCol = [60,60,60];
      if (report.phaseBadge === 'reserve') {
        fill = [255, 243, 205]; stroke = [234, 179, 8]; textCol = [161, 98, 7];
      } else if (report.phaseBadge === 'observation') {
        fill = [219, 234, 254]; stroke = [59, 130, 246]; textCol = [30, 64, 175];
      }
      doc.setFontSize(10);
      const badgeTextWidth = doc.getTextWidth(badgeText);
      const rectW = badgeTextWidth + badgePaddingW * 2;
      const rectH = 8;
      const badgeY = leftInfoY - rectH + 5; // aligner verticalement avec le texte Phase
      // Si la largeur calculée dépasse l'espace réservé à droite, on la recale (rare)
      const adjustedBadgeX = Math.max(margin, badgeX - Math.max(0, rectW - imgSize));
      doc.setDrawColor(...stroke);
      doc.setFillColor(...fill);
      doc.roundedRect(adjustedBadgeX, badgeY, rectW, rectH, 1.5, 1.5, 'FD');
      doc.setTextColor(...textCol);
      doc.text(badgeText, adjustedBadgeX + rectW / 2, badgeY + rectH - 2.2, { align: 'center' });
      doc.setTextColor(0,0,0);
    }
  }

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
        const srcW = Number(report.coverImageWidth) || null;
        const srcH = Number(report.coverImageHeight) || null;
        const ratio = srcW && srcH && srcW > 0 && srcH > 0 ? (srcW / srcH) : (4 / 3);
        let drawW = imgBoxW;
        let drawH = drawW / ratio;
        if (drawH > imgBoxH) {
          drawH = imgBoxH;
          drawW = drawH * ratio;
        }
        const offsetX = imgBoxX + (imgBoxW - drawW) / 2;
        const offsetY = imgBoxY + (imgBoxH - drawH) / 2;
        doc.addImage(report.coverImage, format, offsetX, offsetY, drawW, drawH);
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
    doc.setFontSize(12);
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
  // Forcer les pages suivantes en A4 portrait
  doc.addPage('a4', 'p');
  pageHeight = a4Height;

    // Pas d'en-tête répété sur les pages suivantes (page 2+)
    
    // (Pas de ligne colorée en tête)

  let currentY = CONTENT_TOP_Y;

    // Helper: assure un espace suffisant avant d'imprimer un titre/section.
    // needed = hauteur minimale (mm) que l'on souhaite réserver (titre + première ligne ou marge).
    const ensureSpace = (needed = 30) => {
      const currentPageHeight = doc.internal.pageSize.getHeight();
      const bottomGuard = 25; // marge basse utilisée ailleurs
      if (currentY + needed > currentPageHeight - bottomGuard) {
        doc.addPage('a4', 'p');
        pageHeight = a4Height;
        currentY = CONTENT_TOP_Y;
        return true; // nouvelle page créée
      }
      return false;
    };

    // Sécurité: s'assurer que le contenu commence bien à partir de la page 2
    if (doc.getNumberOfPages() < 2) {
      doc.addPage('a4', 'p');
      pageHeight = a4Height;
      currentY = CONTENT_TOP_Y;
    }

    // Helper: rendu de texte justifié (avec saut de page automatique)
    const drawJustifiedText = (text, x, y, maxWidth, lineHeight = 5.5, options = {}) => {
      const { startYForNewPage = CONTENT_TOP_Y, addHeaderOnNewPage = null } = options;
      const paras = (text || '—').toString().split(/\n+/);
      let cursorY = y;

      const ensureSpace = () => {
        const currentPageHeight = doc.internal.pageSize.getHeight();
        const maxUsableY = currentPageHeight - 30; // garder de la place pour le pied de page
        if (cursorY + lineHeight > maxUsableY) {
            doc.addPage();
          if (typeof addHeaderOnNewPage === 'function') addHeaderOnNewPage();
          cursorY = startYForNewPage;
        }
      };

      paras.forEach((para, pIdx) => {
        const lines = doc.splitTextToSize(para, maxWidth);
        lines.forEach((line, idx) => {
          ensureSpace();
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
        if (pIdx < paras.length - 1) {
          cursorY += lineHeight * 0.5;
        }
      });
      return cursorY;
    };

    // Sections de contenu avec style moderne
    const addModernSection = (title, icon, content, yPosition, titleColor = null) => {
      // Réserver au moins 24mm (titre + espacement) avant de dessiner la section
      ensureSpace(24);
      // Si un saut de page a eu lieu, réaligner yPosition sur currentY
      if (yPosition !== currentY) {
        yPosition = currentY;
      }
      // Titre (couleur configurable, sinon noir)
      if (titleColor && Array.isArray(titleColor)) {
        doc.setTextColor(...titleColor);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
  doc.text(title, margin, yPosition + 10);

      // Contenu (noir) justifié
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const afterY = drawJustifiedText(
        content,
        margin,
        yPosition + 24,
        pageWidth - (margin * 2),
        PAR_LINE_H,
        { startYForNewPage: CONTENT_TOP_Y }
      );

      // espace après section
      return afterY + 10;
    };

    
  // Sections Observations et Actions retirées

    // Section OBJECTIF ET LIMITE DE LA PRESTATION (toujours afficher le titre)
    if (report.objectifLimites) {
      ensureSpace(24);
      currentY = addModernSection("OBJECTIF ET LIMITE DE LA PRESTATION", "", report.objectifLimites, currentY, primaryColor);
    } else {
      // Titre seul en bleu
      ensureSpace(24);
      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
  doc.text("OBJECTIF ET LIMITE DE LA PRESTATION", margin, currentY + 10);
      currentY += 24; // espace titre
    }

  // Section OUVRAGE CONCERNÉ (toujours affichée, lignes vides si non renseignées)
  // Section DÉROULEMENT DE LA VISITE (titre + infos phase/date/personne + texte éventuel)
  // Titre
  ensureSpace(24);
  doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("DÉROULEMENT DE LA VISITE", margin, currentY + 10);
    currentY += 24;

    // Deux lignes d'information
    {
      const maxY = pageHeight - 25;
      const lineH = INFO_LINE_H;
      const rowPad = 4;
      const minLabelW = 85;

      // Phase et date
      //deroulement de la visite
      let visitDateStr = '—';
      try {
        visitDateStr = report.dateIntervention ? new Date(report.dateIntervention).toLocaleDateString('fr-FR') : '—';
      } catch { visitDateStr = report.dateIntervention || '—'; }
      const phaseStr = (report.phase && String(report.phase).trim() !== '') ? String(report.phase) : '—';
      const personne = (report.personneRencontree && String(report.personneRencontree).trim() !== '') ? String(report.personneRencontree) : 'absence de personne';

      const representant = (report.representantSgtec && String(report.representantSgtec).trim() !== '') ? String(report.representantSgtec) : '—';
      const infoRows = [
        ["La visite Phase " + phaseStr + " s'est déroulée le", visitDateStr],
        ["La personne rencontrée sur le site était", personne],
        ["Le représentant du bureau SGTEC était", representant],
      ];

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      infoRows.forEach(([label, value]) => {
        if (currentY + lineH + rowPad > maxY) {
          doc.addPage('a4', 'p');
          pageHeight = a4Height;
          currentY = CONTENT_TOP_Y;
        }
        doc.setFont(undefined, 'bold');
        const labelText = label + ':';
        doc.text(labelText, margin, currentY);
        const labelW = doc.getTextWidth(labelText);
        const textX = margin + Math.max(minLabelW, labelW + 3);
        doc.setFont(undefined, 'normal');
        const availableW = pageWidth - textX - margin;
        const lines = value ? doc.splitTextToSize(String(value), availableW) : [];
        if (lines.length) doc.text(lines, textX, currentY);
        currentY += Math.max(lineH, lines.length * INFO_LINE_H) + rowPad;
      });
      currentY += 4;
    }

    // Sous-titre en bleu: Rapport d'investigation -PHASE (no phase)-
    {
      const maxY = pageHeight - 25;
      const lineH = INFO_LINE_H;
      if (currentY + lineH > maxY) {
        doc.addPage('a4', 'p');
        pageHeight = a4Height;
        currentY = CONTENT_TOP_Y;
      }
      const phaseStrBlue = (report.phase && String(report.phase).trim() !== '') ? String(report.phase) : '—';
      const blueSubtitle = `RAPPORT D'INVESTIGATION -PHASE ${phaseStrBlue}-`;
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
  doc.text(blueSubtitle, margin, currentY);
      currentY += 10;
      doc.setTextColor(0, 0, 0);
    }

    // Tableau INVESTIGATION (données distinctes) juste après RAPPORT D'INVESTIGATION
    {
      const rawRows = Array.isArray(report.investigationPoints) ? report.investigationPoints : [];
      const normalized = rawRows.map(r => ({
        chapitre: (r?.chapitre || '').toString().toUpperCase(),
        moyen: r?.moyen || r?.moyenDeControle || '',
        avis: r?.avis || '',
        commentaire: r?.commentaire || '',
        photo: r?.photo || '',
        photoWidth: r?.photoWidth || 0,
        photoHeight: r?.photoHeight || 0,
      }));
      const hasContent = (row) => [row.chapitre, row.moyen, row.avis, row.commentaire, row.photo]
        .some(v => v != null && String(v).trim() !== '');
      const rows = normalized.filter(hasContent);
      if (rows.length > 0) {
        // Espace disponible ? sinon nouvelle page
        if (currentY + 40 > pageHeight - 25) {
          doc.addPage('a4','p'); pageHeight = a4Height; currentY = CONTENT_TOP_Y;
        }
        // Phrase d'introduction
        doc.setFontSize(9);
        doc.setTextColor(60,60,60);
        const intro = "Le tableau ci-dessous synthétise les constats relevés lors de l'investigation.";
        const introLines = doc.splitTextToSize(intro, pageWidth - (margin*2));
        doc.text(introLines, margin, currentY + 4);
        currentY += (introLines.length * 5) + 6;
        doc.setTextColor(0,0,0);
        const columns = [
          { header: 'Chapitre', key: 'chapitre', w: 30 },
          { header: 'Moyen de\ncontrôle', key: 'moyen', w: 32 },
          { header: 'Avis', key: 'avis', w: 22 },
          { header: 'Commentaire', key: 'commentaire', w: 70 },
          { header: 'Photo / Cliché', key: 'photo', w: 40 },
        ];
        const body = rows.map(r => columns.map(c => (c.key === 'photo' ? '' : (r[c.key] || ''))));
        autoTable(doc, {
          startY: currentY,
          head: [columns.map(c => c.header)],
          body,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3, minCellHeight: 16, lineColor: [200,200,200], lineWidth: 0.1, valign: 'middle' },
          headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontStyle: 'bold', halign: 'center' },
          alternateRowStyles: { fillColor: [245,245,245] },
          columnStyles: columns.reduce((o,c,i)=>{o[i]={cellWidth:c.w, halign: (i===3?'left':'center')}; return o;},{}),
          margin: { left: margin, right: margin },
          willDrawCell: (data) => {
            if (data.section==='body' && data.column.index===2) {
              const rowIdx = data.row.index;
              const avis = (rows[rowIdx]?.avis || '').toLowerCase();
              let txtColor=[0,0,0]; let fill=null;
              if (['conforme','très satisfait','satisfait'].includes(avis)) { txtColor=[22,163,74]; fill=[220,255,228]; }
              else if (['non conforme','insatisfait','très insatisfait'].includes(avis)) { txtColor=[220,38,38]; fill=[255,228,230]; }
              else if (avis==='avec observations') { txtColor=[217,119,6]; fill=[255,243,219]; }
              else if (avis==='neutre') { txtColor=[82,82,82]; fill=[233,233,233]; }
              doc.setTextColor(...txtColor);
              if (fill) {
                const {x,y,width,height}=data.cell; const r=2;
                doc.setFillColor(...fill);
                try { doc.roundedRect(x+0.5,y+0.5,width-1,height-1,r,r,'F'); }
                catch { doc.setDrawColor(...fill); doc.rect(x+0.5,y+0.5,width-1,height-1,'F'); }
              }
            }
          },
          didDrawCell: (data) => {
            if (data.section!=='body') return; if (data.column.index!==4) return;
            const rowIdx = data.row.index; const row = rows[rowIdx] || {}; const val=row.photo;
            try {
              if (val && typeof val==='string' && val.startsWith('data:image')) {
                const cell=data.cell; const maxW=Math.min(20, cell.width-2); const maxH=Math.min(18, cell.height-2);
                let imgW=maxW, imgH=maxH; const pw=Number(row.photoWidth)||0; const ph=Number(row.photoHeight)||0;
                if (pw>0 && ph>0) { const ratio=pw/ph; if (ratio>=1){ imgW=maxW; imgH=Math.min(maxH, maxW/ratio);} else { imgH=maxH; imgW=Math.min(maxW, maxH*ratio);} } else { imgW=imgH=Math.min(maxW,maxH,16); }
                const x=cell.x+(cell.width-imgW)/2; const y=cell.y+(cell.height-imgH)/2; const fmt= val.startsWith('data:image/png')?'PNG':'JPEG';
                doc.addImage(val, fmt, x, y, imgW, imgH);
              }
            } catch {}
          }
        });
        currentY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : currentY + 10;
      }
    }

    // Texte libre (si présent)
    if (report.deroulementVisite) {
      currentY = drawJustifiedText(
        report.deroulementVisite,
        margin,
        currentY,
        pageWidth - (margin * 2),
        PAR_LINE_H,
        { startYForNewPage: CONTENT_TOP_Y }
      ) + 10;
    }

    // Section Équipe avec organigramme simplifié
    if (report.equipe) {
      currentY = addModernSection('ÉQUIPE', '', report.equipe, currentY);
    }

    // Section Matériel avec catégories
    if (report.materiel) {
      currentY = addModernSection('MATÉRIEL', '', report.materiel, currentY);
    }

    // Section Photos du chantier (si disponible)
    if (report.photos && report.photos.length > 0) {
      currentY = addModernSection('PHOTOS', '', '', currentY);
      // Grille de photos à implémenter
    }
    // (Section Météo retirée)

    // Section AUTRES POINTS (affiche uniquement les lignes remplies; si aucune, ne rien afficher)
    {
      // Normaliser et filtrer les lignes avec contenu
      const rawRows = Array.isArray(report.autresPoints) ? report.autresPoints : [];
      const normalized = rawRows.map((r) => ({
        chapitre: (r?.chapitre || '').toString().toUpperCase(),
        element: r?.element || r?.elementObserve || '',
        moyen: r?.moyen || r?.moyenDeControle || '',
        avis: r?.avis || '',
        commentaire: r?.commentaire || '',
        photo: r?.photo || '',
        photoWidth: r?.photoWidth || 0,
        photoHeight: r?.photoHeight || 0,
      }));
      const hasContent = (row) => {
        return [row.chapitre, row.element, row.moyen, row.avis, row.commentaire, row.photo]
          .some(v => v != null && String(v).trim() !== '');
      };
      const rows = normalized.filter(hasContent);

      if (rows.length > 0) {
        const maxY = pageHeight - 25;
        // Vérifie l'espace avant le titre du tableau
        ensureSpace(26);
        // Titre en bleu
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('AUTRES POINTS', margin, currentY + 10);
        currentY += 16;
        doc.setTextColor(0, 0, 0);

        // Phrases de transition (affichées uniquement si contenu)
        const transitionLines = [
          "La section suivante présente les autres points relevés durant l'intervention.",
          
        ];
        doc.setFontSize(9);
        doc.setTextColor(60,60,60);
        transitionLines.forEach(line => {
          doc.text(line, margin, currentY + 4);
          currentY += 5;
        });
        currentY += 2;
        doc.setTextColor(0,0,0);

        // Colonnes et styles du tableau
        const columns = [
          { header: 'Chapitre', dataKey: 'chapitre' },
          { header: 'Élément observé', dataKey: 'element' },
          { header: 'Moyen de\ncontrôle', dataKey: 'moyen' },
          { header: 'Avis', dataKey: 'avis' },
          { header: 'Commentaire', dataKey: 'commentaire' },
          { header: 'Photo', dataKey: 'photo' },
        ];

        // Construire le corps sans la base64 dans la colonne Photo
        const tableBody = rows.map(r => columns.map(c => (c.dataKey === 'photo' ? '' : (r[c.dataKey] ?? ''))));

        const atState = autoTable(doc, {
          startY: currentY,
          head: [columns.map(c => c.header)],
          body: tableBody,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            minCellHeight: 16,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left',
            valign: 'middle',
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          columnStyles: {
            0: { cellWidth: 28 },         // Chapitre (augmenté)
            1: { cellWidth: 24 },         // Élément observé (réajusté)
            2: { cellWidth: 23 },         // Moyen de contrôle (réduit légèrement)
            3: { cellWidth: 21 },         // Avis (réduit)
            4: { cellWidth: 48, halign: 'center' },         // Commentaire (réduit pour équilibrer)
            5: { cellWidth: 26, halign: 'center' }, // Photo (réduit)
          },
          margin: { left: margin, right: margin },
          willDrawCell: (data) => {
            // Coloriser le texte + fond de la colonne Avis
            if (data.section === 'body' && data.column.index === 3) {
              const rowIdx = data.row.index;
              const avis = (rows[rowIdx]?.avis || '').toLowerCase();
              let txtColor = [0,0,0];
              let fill = null;
              if (['conforme','très satisfait','satisfait'].includes(avis)) { txtColor=[22,163,74]; fill=[220,255,228]; }
              else if (['non conforme','insatisfait','très insatisfait'].includes(avis)) { txtColor=[220,38,38]; fill=[255,228,230]; }
              else if (avis === 'avec observations') { txtColor=[217,119,6]; fill=[255,243,219]; }
              else if (avis === 'neutre') { txtColor=[82,82,82]; fill=[233,233,233]; }
              doc.setTextColor(...txtColor);
              if (fill) {
                const { x, y, width, height } = data.cell;
                const r = 2;
                doc.setFillColor(...fill);
                try {
                  doc.roundedRect(x+0.5, y+0.5, width-1, height-1, r, r, 'F');
                } catch {
                  doc.setDrawColor(...fill); doc.rect(x+0.5, y+0.5, width-1, height-1, 'F');
                }
              }
            }
          },
          didDrawCell: (data) => {
            // N'insérer l'image que dans les cellules du corps (pas l'en-tête) de la colonne Photo
            if (data.section !== 'body') return;
            const colIdx = data.column.index;
            if (colIdx !== 5) return; // uniquement colonne Photo
            const rowIdx = data.row.index;
            try {
              const row = rows[rowIdx] || {};
              const val = row.photo;
              if (val && typeof val === 'string' && val.startsWith('data:image')) {
                const cell = data.cell;
                const maxW = Math.min(18, cell.width - 2);
                const maxH = Math.min(18, cell.height - 2);
                let imgW = maxW;
                let imgH = maxH;
                const pw = Number(row.photoWidth) || 0;
                const ph = Number(row.photoHeight) || 0;
                if (pw > 0 && ph > 0) {
                  const ratio = pw / ph;
                  if (ratio >= 1) {
                    imgW = maxW;
                    imgH = Math.min(maxH, maxW / ratio);
                  } else {
                    imgH = maxH;
                    imgW = Math.min(maxW, maxH * ratio);
                  }
                } else {
                  imgW = imgH = Math.min(maxW, maxH, 16);
                }
                const x = cell.x + (cell.width - imgW) / 2;
                const y = cell.y + (cell.height - imgH) / 2;
                const fmt = val.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(val, fmt, x, y, imgW, imgH);
              }
            } catch {
              
            }
          },
          didDrawPage: () => {},
        });

        // Mise à jour du curseur Y après le tableau
        const lastY = atState && atState.finalY ? atState.finalY : (doc.lastAutoTable && doc.lastAutoTable.finalY);
        if (lastY) {
          currentY = lastY + 10;
        } else {
          currentY += 10;
        }
      }
    }

    // Informations complémentaires
    const addInfoBox = (title, content, x, y, width) => {
      // Titres et contenus simples (noir)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, x, y + 10);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      drawJustifiedText(
        content || '—',
        x,
        y + 20,
        width,
        4.5,
        { startYForNewPage: CONTENT_TOP_Y }
      );
    };

    // Ajout de boîtes d'information supplémentaires
  const boxWidth = (pageWidth - margin * 2 - 20) / 2;
  // Section Contraintes particulières et Points de vigilance retirées

    // CONCLUSION (toujours afficher le titre; placeholder si vide)
    {
      const raw = report.conclusion;
      const text = raw == null ? '' : String(raw).trim();
      // Vérifier espace disponible avant d'imprimer le titre
      ensureSpace(24);
      if (text.length > 0) {
        currentY = addModernSection('CONCLUSION', '', text, currentY, primaryColor);
      } else {
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('CONCLUSION', margin, currentY + 10);
        doc.setTextColor(120,120,120);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('—', margin, currentY + 18);
        currentY += 24;
        doc.setTextColor(0,0,0);
      }
    }


  // Préparer le texte de pied de page
  const contentFooterText = 'Sociéte de Gestion des Travaux et Encadrement de Chantier. 60 Rue François Premier 78005 Paris Cedex';
    const contentFooterLines = wrapTextByChars(contentFooterText, 60);
    contentFooterLines.push('Copyright Bureau SGTEC');

    // Numérotation des pages (après avoir dessiné tous les pieds de page)
    const totalPages = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      const footerYPerPage = ph - 20;
      // Dessiner le pied de page pour les pages de contenu (éviter de dupliquer la page de garde si déjà dessinée)
      if (i > 1) {
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, footerYPerPage, pageWidth - margin, footerYPerPage);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(contentFooterLines, pageWidth / 2, footerYPerPage + 8, { align: 'center' });
      }

      // Numéro de page en bas à droite
      const numLabel = `${i} / ${totalPages}`;
      const numY = footerYPerPage + 8; // même Y que le texte du pied de page
      doc.text(numLabel, pageWidth - margin, numY, { align: 'right' });
    }

    if (opts.save) {
  const baseName = (report.proprietaire || report.entreprise || 'Rapport').replace(/\s+/g, '_');
  const filename = `Rapport_${baseName}_${new Date().toISOString().split('T')[0]}.pdf`;
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