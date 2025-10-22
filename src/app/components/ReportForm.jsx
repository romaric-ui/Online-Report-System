// components/ReportForm.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useToast } from './ToastProvider';
import ImageCoverUpload from './ImageCoverUpload';
import { 
  FileText, Eye, Layout, Save, Clock, Sparkles, 
  CheckCircle2, AlertCircle, Loader2, Download,
  Lightbulb, TrendingUp, FileSignature
} from 'lucide-react';

export default function ReportForm({ addReport, reportToEdit, onCancel, onFormStateChange }) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const [form, setForm] = useState(
    reportToEdit || {
      entreprise: "SGTEC L'OEIL DU BATIMENT",
      phase: "",
      noAffaire: "",
      noRapport: "",
      intervenant: "",
      intervenants: [],
      dateIntervention: "",
      proprietaire: "",
      maitreOuvrage: "",
      centreTravaux: "",
      coverImage: "",
      coverImageFile: null, // Fichier image sélectionné
      coverImageType: null, // Type MIME de l'image
  
  phaseBadge: "", // indicateur visuel de phase (réservé / observation)
  phaseBadgeImage: "", // dataURL logo personnalisé éventuel

      objectifLimites: "",
      ouvrageConcerne: "",
      deroulementVisite: "",
    conclusion: "",
  personneRencontree: "",
  representantSgtec: "",
  autresPoints: [],
  investigationPoints: [],

    // Détails sous "Ouvrage concerné"
    typeOuvrage: "", // Il s'agit de
    modeleMaison: "",
    nombreNiveaux: "",
    conducteurTravaux: "",
    noChantierDossier: "",
    entrepriseProjet: "",
    noPlanLSAStandard: "",

  adresseOuvrage: "",
  private: false,
  status: 'En cours',
      
    }
  );
  const [errors, setErrors] = useState([]);
  const [newIntervenant, setNewIntervenant] = useState("");

  // Auto-save simulation toutes les 30 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.phase || form.proprietaire) {
        setIsSaving(true);
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 500);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [form]);

  // Compteur de mots pour les champs textuels
  useEffect(() => {
    const allText = [
      form.objectifLimites,
      form.ouvrageConcerne,
      form.deroulementVisite,
      form.conclusion
    ].join(' ');
    const words = allText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [form.objectifLimites, form.ouvrageConcerne, form.deroulementVisite, form.conclusion]);

  // Couleurs pour AVIS (formulaire) - 4 avis uniquement
  const getAvisColorClass = (avis) => {
    const v = (avis || '').toLowerCase();
    if (v === 'satisfaisant') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (v === 'avec réserve') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (v === 'avec observation') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (v === 'neutre') {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return '';
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Propager l'état du formulaire vers le parent (autosave / dirty tracking)
  useEffect(() => {
    if (typeof onFormStateChange === 'function') {
      onFormStateChange(form);
    }
  }, [form, onFormStateChange]);

  const validateAll = (data, includeStep2 = false) => {
    const missing = [];
    // Phase >= 1
    const phaseEmpty = data.phase === undefined || data.phase === null || String(data.phase).trim() === '';
    const phaseInvalid = !phaseEmpty && Number.isFinite(Number(data.phase)) ? Number(data.phase) < 1 : phaseEmpty;
    if (phaseEmpty || phaseInvalid) missing.push('Phase');
    // Obligatoires
    if (!data.proprietaire || data.proprietaire.trim() === '') missing.push('Propriétaire');
    if (!data.adresseOuvrage || data.adresseOuvrage.trim() === '') missing.push("Adresse de l'ouvrage");

    // Champs obligatoires de la 2e partie (uniquement lors de la soumission finale)
    if (includeStep2) {
      if (!data.modeleMaison || String(data.modeleMaison).trim() === '') missing.push('Modèle de maison');
      const n = data.nombreNiveaux;
      if (n === undefined || n === null || String(n).trim() === '') missing.push('Nombre de niveaux');
      if (!data.conducteurTravaux || String(data.conducteurTravaux).trim() === '') missing.push('Conducteur de travaux du projet');
      // Exiger au moins une ligne dans AUTRES POINTS avec un champ non vide
      const rows = Array.isArray(data.autresPoints) ? data.autresPoints : [];
      const hasAnyContent = rows.some(r => {
        if (!r) return false;
        return [r.chapitre, r.element, r.elementObserve, r.moyen, r.moyenDeControle, r.avis, r.commentaire, r.photo]
          .some(v => v != null && String(v).trim() !== '');
      });
      if (!hasAnyContent) missing.push('AUTRES POINTS (au moins une ligne)');
    }
    return missing;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // On valide tous les champs d'emblée (plus de 2ème étape)
    const missing = validateAll(form, true);
    if (missing.length) {
      setErrors(missing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Focus sur le premier champ manquant pour aider l'utilisateur
      const first = missing[0];
      const nameMap = {
        'Propriétaire': 'proprietaire',
        "Adresse de l'ouvrage": 'adresseOuvrage',
        'Modèle de maison': 'modeleMaison',
        'Nombre de niveaux': 'nombreNiveaux',
        'Conducteur de travaux du projet': 'conducteurTravaux',
      };
      const firstName = nameMap[first];
      if (firstName) {
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstName}"]`);
          if (el && typeof el.focus === 'function') el.focus();
        }, 0);
      }
      return;
    }

    // Soumission directe
    setErrors([]);
    // Préparer la valeur "intervenant" pour le PDF à partir des tags "intervenants"
    const joinedIntervenants = Array.isArray(form.intervenants) && form.intervenants.length
      ? form.intervenants.join(', ')
      : (form.intervenant || '');
    const finalForm = { ...form, intervenant: joinedIntervenants };
    addReport(finalForm);
    setForm({
      entreprise: "SGTEC L'OEIL DU BATIMENT",
      phase: "",
      noAffaire: "",
      noRapport: "",
      intervenant: "",
      intervenants: [],
      dateIntervention: "",
      proprietaire: "",
      maitreOuvrage: "",
      centreTravaux: "",
      coverImage: "",
      coverImageType: null,
    headerLogo: "",
  phaseBadge: "",
  phaseBadgeImage: "",
      objectifLimites: "",
      ouvrageConcerne: "",
      deroulementVisite: "",
      conclusion: "",
  personneRencontree: "",
  representantSgtec: "",
    autresPoints: [],
      typeOuvrage: "",
      modeleMaison: "",
      nombreNiveaux: "",
      conducteurTravaux: "",
      noChantierDossier: "",
      entrepriseProjet: "",
      noPlanLSAStandard: "",
  adresseOuvrage: "",
  private: false,
  status: 'En cours',
      
    });
    // Préparer quelques lignes vides pour un nouvel enregistrement ultérieur
    setNewIntervenant("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fonction pour gérer la sélection d'image de couverture
  const handleImageSelect = (file) => {
    setForm({ ...form, coverImageFile: file });
    
    // Si un fichier est sélectionné, créer un aperçu
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm(prev => ({ 
          ...prev, 
          coverImage: e.target.result,
          coverImageType: file.type // Sauvegarder le type MIME
        }));
      };
      reader.readAsDataURL(file);
    } else {
      // Supprimer l'aperçu si aucun fichier
      setForm(prev => ({ 
        ...prev, 
        coverImage: '', 
        coverImageFile: null,
        coverImageType: null
      }));
    }
  };

  // Attachments, checklist, problèmes/solutions supprimés

  // Mettre à jour le formulaire quand reportToEdit change
  useEffect(() => {
    if (reportToEdit) {
      // Merge into defaults to avoid undefined values in inputs
      setForm((prev) => {
        const merged = { ...prev, ...reportToEdit };
        // Pré-remplir les tags intervenants si seulement une chaîne est fournie
        if (!Array.isArray(merged.intervenants)) {
          const src = merged.intervenant || '';
          const parts = src.split(/[;,]/).map(s => s.trim()).filter(Boolean);
          merged.intervenants = parts;
        }
        return merged;
      });
    }
  }, [reportToEdit]);

  const allFields = [
    'entreprise', 'phase', 'phaseBadge', 'noAffaire', 'noRapport', 'intervenants', 'dateIntervention', 'coverImage',
    'centreTravaux', 'maitreOuvrage', 'adresseOuvrage', 'proprietaire', 'status',
    'objectifLimites', 'ouvrageConcerne', 'deroulementVisite'
  ];

  // Regroupement visuel (anciennement "deuxième partie" maintenant intégré directement)
  const step2Fields = ['objectifLimites', 'ouvrageConcerne', 'deroulementVisite'];
  const mainFields = allFields.filter((k) => !step2Fields.includes(k));

  // Initialiser quelques lignes vides AUTRES POINTS si vide (pour encourager la saisie)
  useEffect(() => {
    if (!reportToEdit) {
      setForm(prev => {
        if (prev.autresPoints && prev.autresPoints.length) return prev;
        return {
          ...prev,
          autresPoints: [
            { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
            { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
            { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
          ]
        };
      });
    }
  }, [reportToEdit]);

  return (
    <form
      onSubmit={handleSubmit}
      className="form-data-entry bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl max-w-7xl mx-auto grid gap-8 border border-gray-100"
    >
      {/* En-tête du formulaire avec stats */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {reportToEdit ? 'Modifier le rapport' : 'Nouveau rapport'}
            </h2>
            <p className="text-sm text-gray-500">
              {wordCount} mots • {isSaving ? 'Sauvegarde...' : lastSaved ? `Sauvegardé ${lastSaved.toLocaleTimeString()}` : 'Non sauvegardé'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sauvegarde...</span>
            </div>
          )}
          {lastSaved && !isSaving && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sauvegardé</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation ancrée rapide */}
      <div className="sticky top-0 z-30 -mx-6 px-6 py-3 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="flex gap-3 flex-wrap text-xs font-medium">
          <a href="#general" className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">Général</a>
          <a href="#descriptions" className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">Descriptions</a>
          <a href="#visite" className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">Visite</a>
          <a href="#details-ouvrage" className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">Détails Ouvrage</a>
          <a href="#investigation" className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">Investigation</a>
          <a href="#autres-points" className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">Autres points</a>
          <a href="#conclusion" className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">Conclusion</a>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-3 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Champs obligatoires manquants</p>
            <p className="text-sm mt-1">{errors.join(', ')}</p>
          </div>
        </div>
      )}


      {/* Partie 1: Champs principaux */}
  <div id="general" className="section-anchor form-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm"  style={{ scrollMarginTop: '100px' }}>
        {mainFields.map((key) => {
          const longFields = step2Fields; // aucun champ long dans la partie 1
          const isLongField = longFields.includes(key);
          const isFullWidth = ['adresseOuvrage', 'coverImage', ...longFields].includes(key);
          const labelText = (
            key === 'adresseOuvrage' ? "Adresse de l'ouvrage" :
            key === 'dateIntervention' ? "Date d'Intervention" :
            key === 'noAffaire' ? "N° affaire" :
            key === 'noRapport' ? "N° Rapport" :
            key === 'intervenants' ? "Intervenants" :
            key === 'maitreOuvrage' ? "Maître d'ouvrage" :
            key === 'centreTravaux' ? "Centre de Travaux" :
            key === 'coverImage' ? "Image du panneau de chantier" :
            key === 'phaseBadge' ? "Indicateur Phase" :
            key.replace(/([A-Z])/g, " $1")
          );
          return (
            <div key={key} className={`flex flex-col min-w-0 ${isFullWidth ? "lg:col-span-3 md:col-span-2" : ""}`}>
              <label className="text-sm font-semibold text-gray-700 mb-2 capitalize break-words">{labelText}</label>
              {isLongField ? (
                <></>
              ) : key === 'intervenants' ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ajouter un intervenant et appuyer sur Entrée"
                      value={newIntervenant}
                      onChange={(e) => setNewIntervenant(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const raw = newIntervenant;
                          if (!raw) return;
                          const parts = raw.split(/[;,]/).map(s => s.trim()).filter(Boolean);
                          if (!parts.length) return;
                          setForm((prev) => ({
                            ...prev,
                            intervenants: Array.from(new Set([...(prev.intervenants || []), ...parts]))
                          }));
                          setNewIntervenant('');
                        }
                      }}
                      className="input-sm w-full"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-600 text-white rounded text-xs"
                      onClick={() => {
                        const raw = newIntervenant;
                        if (!raw) return;
                        const parts = raw.split(/[;,]/).map(s => s.trim()).filter(Boolean);
                        if (!parts.length) return;
                        setForm((prev) => ({
                          ...prev,
                          intervenants: Array.from(new Set([...(prev.intervenants || []), ...parts]))
                        }));
                        setNewIntervenant('');
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                  {(form.intervenants && form.intervenants.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {form.intervenants.map((name, idx) => (
                        <span key={`${name}-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-[0.65rem] tracking-wide">
                          <span>{name}</span>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-red-600"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                intervenants: (prev.intervenants || []).filter((_, i) => i !== idx)
                              }));
                            }}
                            aria-label={`Retirer ${name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        className="text-[0.6rem] text-red-600 hover:underline"
                        onClick={() => setForm((prev) => ({ ...prev, intervenants: [] }))}
                      >
                        Tout effacer
                      </button>
                    </div>
                  )}
                </div>
              ) : key === 'coverImage' ? (
                <ImageCoverUpload
                  onImageSelect={handleImageSelect}
                  currentImage={form.coverImage}
                />
              ) : key === 'phaseBadge' ? (
                <div className="space-y-1">
                  <select
                    name={key}
                    value={form[key] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        phaseBadge: val,
                        phaseBadgeImage: val === 'reserve'
                          ? '/reserve-removebg.png'
                          : val === 'observation'
                            ? '/observation-removebg.png'
                            : ''
                      }));
                    }}
                    className="input-sm w-full bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="reserve">Réservé</option>
                    <option value="observation">Avec observation</option>
                  </select>
                  <p className="text-xs text-gray-500">Le logo correspondant sera ajouté automatiquement à la page de garde du PDF.</p>
                </div>
              ) : key === 'phase' ? (
                <input
                  type="number"
                  min={1}
                  name={key}
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  className="input-sm w-full"
                  placeholder="Numéro de phase"
                />
              ) : (
                <input
                  type={key === 'phase' ? 'number' : key === 'dateIntervention' ? 'date' : 'text'}
                  name={key}
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  className="input-sm w-full"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Ancienne deuxième partie (affichée directement) */}
      <div id="descriptions" className="section-anchor" style={{ scrollMarginTop: '100px' }}>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Descriptions générales</h3>
              <p className="text-sm text-gray-500">Ces blocs décrivent le contexte et apparaîtront après la page de garde.</p>
            </div>
          </div>

          {/* Champs longue description */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {step2Fields.map((key) => {
                  const labelText = (
                    key === 'objectifLimites' ? "Objectif et limites de la prestation" :
                    key === 'ouvrageConcerne' ? "Ouvrage concerné" :
                    key === 'deroulementVisite' ? "Déroulement de la visite" :
                    key.replace(/([A-Z])/g, ' $1')
                  );
                  return (
                    <div key={key} className="flex flex-col min-w-0 lg:col-span-3 md:col-span-2">
                      <label className="font-semibold capitalize mb-1 break-words">{labelText}</label>
                      <textarea
                        name={key}
                        value={form[key] ?? ''}
                        onChange={handleChange}
                        className="textarea-sm w-full"
                        placeholder={`Saisissez ${
                          key === 'objectifLimites' ? "l'objectif et les limites de la prestation" :
                          key === 'ouvrageConcerne' ? "les éléments d'ouvrage concernés" :
                          key === 'deroulementVisite' ? "le déroulement de la visite" :
                          key.replace(/([A-Z])/g, ' $1').toLowerCase()
                        }...`}
                        maxLength={2000}
                      />
                    </div>
                  );
                })}
              </div>
          </div>
      </div>

      {/* Infos de visite */}
      <div id="visite" className="section-anchor" style={{ scrollMarginTop: '100px' }}>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div className="flex flex-col lg:col-span-3 md:col-span-2">
              <label className="font-semibold mb-1">Personne rencontrée sur le site</label>
              <input
                type="text"
                name="personneRencontree"
                value={form.personneRencontree || ''}
                onChange={handleChange}
                className="input-sm w-full"
                placeholder="Nom de la personne rencontrée"
              />
              <span className="text-xs text-gray-500 mt-1">Si ce champ est vide, le PDF affichera « absence de personne ».</span>
            </div>
            <div className="flex flex-col lg:col-span-3 md:col-span-2">
              <label className="font-semibold mb-1">Représentant du bureau SGTEC</label>
              <input
                type="text"
                name="representantSgtec"
                value={form.representantSgtec || ''}
                onChange={handleChange}
                className="input-sm w-full"
                placeholder="Nom du représentant du bureau SGTEC"
              />
            </div>
          </div>
      </div>

      {/* Détails affichés sous "Ouvrage concerné" */}
      <div id="details-ouvrage" className="section-anchor" style={{ scrollMarginTop: '100px' }}>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Il s'agit de</label>
              <select
                name="typeOuvrage"
                value={form.typeOuvrage || ''}
                onChange={handleChange}
                className="input-sm w-full bg-white"
              >
                <option value="">-- Sélectionner --</option>
                <option value="Maison individuelle">Maison individuelle</option>
                <option value="Appartement">Appartement</option>
                <option value="Copropriété">Copropriété</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Adresse de l'ouvrage</label>
              <input
                type="text"
                name="adresseOuvrage"
                value={form.adresseOuvrage || ''}
                onChange={handleChange}
                className="input-sm w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Modèle de maison</label>
              <input
                type="text"
                name="modeleMaison"
                value={form.modeleMaison || ''}
                onChange={handleChange}
                className="input-sm w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Nombre de niveaux</label>
              <input
                type="number"
                min={0}
                name="nombreNiveaux"
                value={form.nombreNiveaux || ''}
                onChange={handleChange}
                className="input-sm w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Conducteur de travaux du projet</label>
              <input
                type="text"
                name="conducteurTravaux"
                value={form.conducteurTravaux || ''}
                onChange={handleChange}
                className="input-sm w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">N° chantier/dossier</label>
              <input
                type="text"
                name="noChantierDossier"
                value={form.noChantierDossier || ''}
                onChange={handleChange}
                className="input-sm w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Entreprise</label>
              <input
                type="text"
                name="entrepriseProjet"
                value={form.entrepriseProjet || ''}
                onChange={handleChange}
                className="input-sm w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">N° plan LSA STANDARD</label>
              <input
                type="text"
                name="noPlanLSAStandard"
                value={form.noPlanLSAStandard || ''}
                onChange={handleChange}
                className="input-sm w-full"
              />
            </div>
          </div>
      </div>

      {/* INVESTIGATION (tableau sous RAPPORT D'INVESTIGATION) */}
      <div id="investigation" className="section-anchor bg-white p-6 rounded-xl border border-gray-200 shadow-sm" style={{ scrollMarginTop: '100px' }}>
            <h4 className="text-base font-bold text-blue-600 mb-2">TABLEAU D'INVESTIGATION</h4>
            <p className="text-xs text-gray-600 mb-2">Saisir ici les constats principaux de l'investigation (distincts des "AUTRES POINTS").</p>
            <div className="overflow-x-auto border rounded-lg mb-3">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-3 py-2 text-left">Chapitre</th>
                    <th className="px-3 py-2 text-left">Moyen de contrôle</th>
                    <th className="px-3 py-2 text-left">Avis</th>
                    <th className="px-3 py-2 text-left">Commentaire</th>
                    <th className="px-3 py-2 text-left table-photo-col">Photo</th>
                    <th className="px-2 py-2 text-center w-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.investigationPoints || []).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 align-top">
                        <input
                          type="text"
                          value={row.chapitre || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.investigationPoints || [])];
                            next[idx] = { ...(next[idx]||{}), chapitre: (e.target.value||'').toUpperCase() };
                            return { ...prev, investigationPoints: next };
                          })}
                          className="table-input w-full uppercase"
                          placeholder="Ex: 1, A..."
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select
                          value={row.moyen || row.moyenDeControle || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.investigationPoints || [])];
                            next[idx] = { ...(next[idx]||{}), moyen: e.target.value };
                            return { ...prev, investigationPoints: next };
                          })}
                          className="table-select w-full bg-white"
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Visuel">Visuel</option>
                          <option value="Ferroscan">Ferroscan</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select
                          value={row.avis || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.investigationPoints || [])];
                            next[idx] = { ...(next[idx]||{}), avis: e.target.value };
                            return { ...prev, investigationPoints: next };
                          })}
                          className={`table-select w-full bg-white ${getAvisColorClass(row.avis)}`}
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Neutre">Neutre</option>
                          <option value="Satisfaisant">Satisfaisant</option>
                          <option value="Avec observation">Avec observation</option>
                          <option value="Avec réserve">Avec réserve</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <textarea
                          value={row.commentaire || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.investigationPoints || [])];
                            next[idx] = { ...(next[idx]||{}), commentaire: e.target.value };
                            return { ...prev, investigationPoints: next };
                          })}
                          onInput={(e)=>{e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px';}}
                          className="table-textarea comment w-full"
                          placeholder="Commentaire"
                        />
                      </td>
                      <td className="px-2 py-2 align-top table-photo-col">
                        <div className="flex flex-col gap-1 table-photo-wrapper">
                          {row.photo ? (
                            <div className="flex items-center gap-2">
                              <img src={row.photo} alt="aperçu" className="object-cover rounded border" />
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:underline"
                                onClick={() => setForm(prev => {
                                  const next = [...(prev.investigationPoints || [])];
                                  next[idx] = { ...(next[idx]||{}), photo: '', photoWidth: undefined, photoHeight: undefined };
                                  return { ...prev, investigationPoints: next };
                                })}
                              >Supprimer</button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const type = (file.type || '').toLowerCase();
                                const ok = type === 'image/png' || type === 'image/jpeg';
                                if (!ok) { toast.error('Formats acceptés: PNG, JPG'); e.target.value=''; return; }
                                const maxDim = 600;
                                async function process(f) {
                                  try {
                                    if ('createImageBitmap' in window) {
                                      const bmp = await createImageBitmap(f);
                                      let { width, height } = bmp;
                                      const ratio = width / height;
                                      let targetW = width, targetH = height;
                                      if (Math.max(width, height) > maxDim) {
                                        if (width >= height) { targetW = maxDim; targetH = Math.round(maxDim / ratio); }
                                        else { targetH = maxDim; targetW = Math.round(maxDim * ratio); }
                                      }
                                      const canvas = document.createElement('canvas');
                                      canvas.width = targetW; canvas.height = targetH;
                                      const ctx = canvas.getContext('2d');
                                      ctx.drawImage(bmp, 0, 0, targetW, targetH);
                                      const dataUrl = canvas.toDataURL(type.includes('png') ? 'image/png' : 'image/jpeg', 0.9);
                                      try { bmp.close && bmp.close(); } catch {}
                                      return { dataUrl, width: targetW, height: targetH };
                                    }
                                  } catch {}
                                  // fallback
                                  const objUrl = URL.createObjectURL(f);
                                  const img = new Image();
                                  const res = await new Promise((resolve, reject) => {
                                    img.onload = () => {
                                      try {
                                        let width = img.naturalWidth, height = img.naturalHeight;
                                        const ratio = width/height;
                                        let targetW = width, targetH = height;
                                        if (Math.max(width, height) > maxDim) {
                                          if (width >= height) { targetW = maxDim; targetH = Math.round(maxDim/ratio);} else { targetH = maxDim; targetW = Math.round(maxDim*ratio);} }
                                        const canvas = document.createElement('canvas');
                                        canvas.width = targetW; canvas.height = targetH;
                                        const ctx = canvas.getContext('2d');
                                        ctx.drawImage(img, 0, 0, targetW, targetH);
                                        const dataUrl = canvas.toDataURL(type.includes('png') ? 'image/png' : 'image/jpeg', 0.9);
                                        resolve({ dataUrl, width: targetW, height: targetH });
                                      } catch (err) { resolve(null); }
                                    };
                                    img.onerror = () => resolve(null);
                                    img.src = objUrl;
                                  });
                                  try { URL.revokeObjectURL(objUrl); } catch {}
                                  return res;
                                }
                                const processed = await process(file);
                                if (!processed) { toast.error('Erreur lors du traitement de l\'image'); return; }
                                setForm(prev => {
                                  const next = [...(prev.investigationPoints || [])];
                                  next[idx] = { ...(next[idx]||{}), photo: processed.dataUrl, photoWidth: processed.width, photoHeight: processed.height };
                                  return { ...prev, investigationPoints: next };
                                });
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top text-center">
                        <button
                          type="button"
                          onClick={() => setForm(prev => {
                            const next = [...(prev.investigationPoints || [])];
                            next.splice(idx,1);
                            return { ...prev, investigationPoints: next };
                          })}
                          className="text-xs text-red-600 hover:underline"
                        >Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({
                ...prev,
                investigationPoints: [
                  ...(prev.investigationPoints || []),
                  { chapitre: '', moyen: '', avis: '', commentaire: '', photo: '', photoWidth: undefined, photoHeight: undefined }
                ]
              }))}
              className="px-3 py-2 bg-blue-600 text-white rounded text-xs"
            >Ajouter une ligne INVESTIGATION</button>
      </div>

      {/* AUTRES POINTS */}
      <div id="autres-points" className="section-anchor bg-white p-6 rounded-xl border border-gray-200 shadow-sm" style={{ scrollMarginTop: '100px' }}>
            <h4 className="text-base font-bold text-blue-600 mb-2">AUTRES POINTS</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-3 py-2 text-left">Chapitre</th>
                    <th className="px-3 py-2 text-left">Élément observé</th>
                    <th className="px-3 py-2 text-left">Moyen de contrôle</th>
                    <th className="px-3 py-2 text-left">Avis</th>
                    <th className="px-3 py-2 text-left">Commentaire</th>
                    <th className="px-3 py-2 text-left table-photo-col">Photo</th>
                    <th className="px-2 py-2 text-center w-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.autresPoints && form.autresPoints.length > 0 ? form.autresPoints : []).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 align-top">
                        <input
                          type="text"
                          value={row.chapitre || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.autresPoints || [])];
                            next[idx] = { ...(next[idx] || {}), chapitre: (e.target.value || '').toUpperCase() };
                            return { ...prev, autresPoints: next };
                          })}
                          className="table-input w-full uppercase"
                          placeholder="Ex: 1, A, etc."
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <textarea
                          value={row.element || row.elementObserve || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.autresPoints || [])];
                            next[idx] = { ...(next[idx] || {}), element: e.target.value };
                            return { ...prev, autresPoints: next };
                          })}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                          className="table-textarea w-full"
                          placeholder="Élément observé"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select
                          value={row.moyen || row.moyenDeControle || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.autresPoints || [])];
                            next[idx] = { ...(next[idx] || {}), moyen: e.target.value };
                            return { ...prev, autresPoints: next };
                          })}
                          className="table-select w-full bg-white"
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Visuel">Visuel</option>
                          <option value="Ferroscan">Ferroscan</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select
                          value={row.avis || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.autresPoints || [])];
                            next[idx] = { ...(next[idx] || {}), avis: e.target.value };
                            return { ...prev, autresPoints: next };
                          })}
                          className={`table-select w-full bg-white ${getAvisColorClass(row.avis)}`}
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Neutre">Neutre</option>
                          <option value="Satisfaisant">Satisfaisant</option>
                          <option value="Avec observation">Avec observation</option>
                          <option value="Avec réserve">Avec réserve</option>

                        </select>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <textarea
                          value={row.commentaire || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.autresPoints || [])];
                            next[idx] = { ...(next[idx] || {}), commentaire: e.target.value };
                            return { ...prev, autresPoints: next };
                          })}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                          className="table-textarea comment w-full"
                          placeholder="Commentaire"
                        />
                      </td>
                      <td className="px-2 py-2 align-top table-photo-col">
                        <div className="flex flex-col gap-1 table-photo-wrapper">
                          {row.photo ? (
                            <div className="flex items-center gap-2">
                              <img src={row.photo} alt="aperçu" className="object-cover rounded border" />
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:underline"
                                onClick={() => setForm(prev => {
                                  const next = [...(prev.autresPoints || [])];
                                  next[idx] = { ...(next[idx] || {}), photo: '', photoWidth: undefined, photoHeight: undefined };
                                  return { ...prev, autresPoints: next };
                                })}
                              >Supprimer</button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const type = (file.type || '').toLowerCase();
                                const ok = type === 'image/png' || type === 'image/jpeg';
                                if (!ok) { toast.error('Formats acceptés: PNG, JPG'); e.target.value=''; return; }
                                const maxDim = 600;
                                async function process(f) {
                                  try {
                                    if ('createImageBitmap' in window) {
                                      const bmp = await createImageBitmap(f);
                                      let { width, height } = bmp;
                                      const ratio = width / height;
                                      let targetW = width, targetH = height;
                                      if (Math.max(width, height) > maxDim) {
                                        if (width >= height) { targetW = maxDim; targetH = Math.round(maxDim / ratio); }
                                        else { targetH = maxDim; targetW = Math.round(maxDim * ratio); }
                                      }
                                      const canvas = document.createElement('canvas');
                                      canvas.width = targetW; canvas.height = targetH;
                                      const ctx = canvas.getContext('2d');
                                      ctx.drawImage(bmp, 0, 0, targetW, targetH);
                                      const dataUrl = canvas.toDataURL(type.includes('png') ? 'image/png' : 'image/jpeg', 0.9);
                                      try { bmp.close && bmp.close(); } catch {}
                                      return { dataUrl, width: targetW, height: targetH };
                                    }
                                  } catch {}
                                  // fallback
                                  const objUrl = URL.createObjectURL(f);
                                  const img = new Image();
                                  const res = await new Promise((resolve, reject) => {
                                    img.onload = () => {
                                      try {
                                        let width = img.naturalWidth, height = img.naturalHeight;
                                        const ratio = width/height;
                                        let targetW = width, targetH = height;
                                        if (Math.max(width, height) > maxDim) {
                                          if (width >= height) { targetW = maxDim; targetH = Math.round(maxDim/ratio);} else { targetH = maxDim; targetW = Math.round(maxDim*ratio);} }
                                        const canvas = document.createElement('canvas');
                                        canvas.width = targetW; canvas.height = targetH;
                                        const ctx = canvas.getContext('2d');
                                        ctx.drawImage(img, 0, 0, targetW, targetH);
                                        const dataUrl = canvas.toDataURL(type.includes('png') ? 'image/png' : 'image/jpeg', 0.9);
                                        resolve({ dataUrl, width: targetW, height: targetH });
                                      } catch (err) { reject(err); } finally { URL.revokeObjectURL(objUrl); }
                                    };
                                    img.onerror = (err) => { URL.revokeObjectURL(objUrl); reject(err); };
                                    img.src = objUrl;
                                  });
                                  return res;
                                }
                                try {
                                  const out = await process(file);
                                  setForm(prev => {
                                    const next = [...(prev.autresPoints || [])];
                                    next[idx] = { ...(next[idx] || {}), photo: out.dataUrl, photoWidth: out.width, photoHeight: out.height };
                                    return { ...prev, autresPoints: next };
                                  });
                                } catch (err) {
                                  console.error('Erreur image:', err);
                                }
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center align-top">
                        <button
                          type="button"
                          className="px-2 py-1 text-xs text-red-600 hover:underline"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            autresPoints: (prev.autresPoints || []).filter((_, i) => i !== idx)
                          }))}
                        >
                          Suppr.
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!form.autresPoints || form.autresPoints.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                        Aucune ligne. Cliquez sur « Ajouter une ligne ».
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="px-3 py-2 bg-blue-600 text-white rounded"
                onClick={() => setForm(prev => ({ ...prev, autresPoints: [...(prev.autresPoints || []), { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' }] }))}
              >
                Ajouter une ligne
              </button>
              {form.autresPoints && form.autresPoints.length > 0 && (
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded"
                  onClick={() => setForm(prev => ({ ...prev, autresPoints: [] }))}
                >
                  Vider
                </button>
              )}
            </div>
      </div>

      {/* CONCLUSION */}
      <div id="conclusion" className="section-anchor bg-white p-6 rounded-xl border border-gray-200 shadow-sm" style={{ scrollMarginTop: '100px' }}>
            <h4 className="text-base font-bold text-blue-600 mb-2">Conclusion</h4>
            <textarea
              name="conclusion"
              value={form.conclusion || ''}
              onChange={handleChange}
              className="textarea-sm w-full"
              placeholder="Saisissez la conclusion..."
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 mt-1"></div>
      </div>
      

      {/* Visibilité (public/privé) retirée de l'UI; par défaut, visible */}
      {/* Section Pièces jointes, Checklist QA, Problèmes/Solutions retirées */}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <Save className="w-5 h-5" />
          {reportToEdit ? 'Mettre à jour le rapport' : 'Ajouter le rapport'}
        </button>
        <button
          type="button"
          onClick={() => { setForm({
            entreprise: "SGTEC L'OEIL DU BATIMENT",
            phase: "",
            noAffaire: "",
            noRapport: "",
            intervenant: "",
            intervenants: [],
            dateIntervention: "",
            proprietaire: "",
            maitreOuvrage: "",
            centreTravaux: "",
            coverImage: "",
            phaseBadge: '',
            phaseBadgeImage: '',
            headerLogo: "",
            objectifLimites: "",
            ouvrageConcerne: "",
            deroulementVisite: "",
            personneRencontree: "",
            representantSgtec: "",
            autresPoints: [
              { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
              { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
              { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' }
            ],
            investigationPoints: [],
            adresseOuvrage: "",
            private: false,
            status: 'En cours',
          }); setNewIntervenant(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-medium"
        >
          Réinitialiser
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-medium border border-gray-300"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
