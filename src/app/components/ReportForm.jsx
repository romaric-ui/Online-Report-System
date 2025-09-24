// components/ReportForm.jsx
"use client";
import { useState, useEffect, useRef } from "react";

export default function ReportForm({ addReport, reportToEdit, onCancel }) {
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
  const [showStep2, setShowStep2] = useState(false);
  const step2Ref = useRef(null);
  const [newIntervenant, setNewIntervenant] = useState("");

  // Couleurs pour AVIS (formulaire)
  const getAvisColorClass = (avis) => {
    const v = (avis || '').toLowerCase();
    if (v === 'conforme' || v === 'très satisfait' || v === 'satisfait') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (v === 'non conforme' || v === 'insatisfait' || v === 'très insatisfait') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (v === 'avec observations') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (v === 'neutre') {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return '';
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
  const missing = validateAll(form, showStep2);
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

    // Si la deuxième partie n'est pas encore affichée, on l'affiche maintenant (sans enregistrer)
    if (!showStep2) {
      setErrors([]);
      setShowStep2(true);
      // Préremplir 3 lignes vides pour AUTRES POINTS afin d'encourager la saisie
      setForm(prev => {
        const exists = Array.isArray(prev.autresPoints) && prev.autresPoints.length > 0;
        if (exists) return prev;
        return {
          ...prev,
          autresPoints: [
            { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
            { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
            { chapitre: '', element: '', moyen: '', avis: '', commentaire: '' },
          ]
        };
      });
      // scroll vers la deuxième partie
      setTimeout(() => {
        if (step2Ref.current && typeof step2Ref.current.scrollIntoView === 'function') {
          step2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
      return;
    }

    // Deuxième soumission: on enregistre réellement
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
    setShowStep2(false);
    setNewIntervenant("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Regroupement visuel: les 3 champs de la "deuxième partie" après la page de garde
  // Les champs longs de la deuxième partie (Conclusion sera déplacée après le tableau AUTRES POINTS)
  const step2Fields = ['objectifLimites', 'ouvrageConcerne', 'deroulementVisite'];
  const mainFields = allFields.filter((k) => !step2Fields.includes(k));

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-lg grid gap-6"
    >
      {errors.length > 0 && (
        <div className="p-2 bg-red-50 border border-red-100 text-red-700 rounded">
          Champs obligatoires manquants: {errors.join(', ')}
        </div>
      )}


      {/* Partie 1: Champs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
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
            key === 'coverImage' ? "Image de couverture" :
            key === 'phaseBadge' ? "Indicateur Phase" :
            key.replace(/([A-Z])/g, " $1")
          );
          return (
            <div key={key} className={`flex flex-col min-w-0 ${isFullWidth ? "lg:col-span-3 md:col-span-2" : ""}`}>
              <label className="font-semibold capitalize mb-1 break-words">{labelText}</label>
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
                      className="p-2 border rounded w-full"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-600 text-white rounded"
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
                        <span key={`${name}-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                          <span>{name}</span>
                          <button
                            type="button"
                            className="text-gray-600 hover:text-red-600"
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
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => setForm((prev) => ({ ...prev, intervenants: [] }))}
                      >
                        Tout effacer
                      </button>
                    </div>
                  )}
                </div>
              ) : key === 'coverImage' ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) { setForm(prev => ({ ...prev, coverImage: '' })); return; }
                      // Lecture simple + dimensions
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          const img = new Image();
                          img.onload = () => {
                            setForm(prev => ({
                              ...prev,
                              coverImage: reader.result,
                              coverImageWidth: img.naturalWidth,
                              coverImageHeight: img.naturalHeight
                            }));
                          };
                          img.src = reader.result;
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="p-2 border rounded w-full"
                  />
                  <div className="text-xs text-gray-500">Formats acceptés: PNG, JPG, JPEG</div>
                  {form.coverImage && (
                    <img src={form.coverImage} alt="aperçu" className="h-24 w-auto rounded border bg-white" />
                  )}
                </div>
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
                    className="p-2 border rounded w-full bg-white"
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
                  className="p-2 border rounded w-full"
                  placeholder="Numéro de phase"
                />
              ) : (
                <input
                  type={key === 'phase' ? 'number' : key === 'dateIntervention' ? 'date' : 'text'}
                  name={key}
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Séparateur visuel de la deuxième partie */}
      {showStep2 && (
        <div ref={step2Ref}>
          <div className="mt-6 mb-2">
            <hr className="border-gray-200" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Deuxième partie</h3>
          <p className="text-sm text-gray-500 mb-4">Ces champs apparaîtront uniquement après la page de garde (page 2) du PDF.</p>

          {/* Partie 2: Champs longue description */}
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
                        className="p-2 border rounded min-h-[120px] resize-y w-full"
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

          {/* Infos de visite */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div className="flex flex-col lg:col-span-3 md:col-span-2">
              <label className="font-semibold mb-1">Personne rencontrée sur le site</label>
              <input
                type="text"
                name="personneRencontree"
                value={form.personneRencontree || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
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
                className="p-2 border rounded w-full"
                placeholder="Nom du représentant du bureau SGTEC"
              />
            </div>
          </div>

          {/* Détails à afficher sous "Ouvrage concerné" */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Il s'agit de</label>
              <input
                type="text"
                name="typeOuvrage"
                value={form.typeOuvrage || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
                placeholder="Ex: Maison individuelle, Appartement..."
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Adresse de l'ouvrage</label>
              <input
                type="text"
                name="adresseOuvrage"
                value={form.adresseOuvrage || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Modèle de maison</label>
              <input
                type="text"
                name="modeleMaison"
                value={form.modeleMaison || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
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
                className="p-2 border rounded w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Conducteur de travaux du projet</label>
              <input
                type="text"
                name="conducteurTravaux"
                value={form.conducteurTravaux || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">N° chantier/dossier</label>
              <input
                type="text"
                name="noChantierDossier"
                value={form.noChantierDossier || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Entreprise</label>
              <input
                type="text"
                name="entrepriseProjet"
                value={form.entrepriseProjet || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold mb-1">N° plan LSA STANDARD</label>
              <input
                type="text"
                name="noPlanLSAStandard"
                value={form.noPlanLSAStandard || ''}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
          </div>

          {/* INVESTIGATION (tableau sous RAPPORT D'INVESTIGATION) */}
          <div className="mt-8">
            <h4 className="text-base font-semibold text-blue-600 mb-2">TABLEAU D'INVESTIGATION</h4>
            <p className="text-xs text-gray-600 mb-2">Saisir ici les constats principaux de l'investigation (distincts des "AUTRES POINTS").</p>
            <div className="overflow-x-auto border rounded-lg mb-3">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-3 py-2 text-left">Chapitre</th>
                    <th className="px-3 py-2 text-left">Moyen de contrôle</th>
                    <th className="px-3 py-2 text-left">Avis</th>
                    <th className="px-3 py-2 text-left">Commentaire</th>
                    <th className="px-3 py-2 text-left">Photo / Cliché</th>
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
                          className="p-2 border rounded w-full uppercase"
                          placeholder="Ex: 1, A..."
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <textarea
                          value={row.moyen || row.moyenDeControle || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.investigationPoints || [])];
                            next[idx] = { ...(next[idx]||{}), moyen: e.target.value };
                            return { ...prev, investigationPoints: next };
                          })}
                          onInput={(e)=>{e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px';}}
                          className="p-2 border rounded w-full min-h-[40px] resize-none overflow-hidden"
                          placeholder="Moyen de contrôle"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select
                          value={row.avis || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.investigationPoints || [])];
                            next[idx] = { ...(next[idx]||{}), avis: e.target.value };
                            return { ...prev, investigationPoints: next };
                          })}
                          className={`p-2 border rounded w-full bg-white ${getAvisColorClass(row.avis)}`}
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Conforme">Conforme</option>
                          <option value="Non conforme">Non conforme</option>
                          <option value="Très satisfait">Très satisfait</option>
                          <option value="Satisfait">Satisfait</option>
                          <option value="Insatisfait">Insatisfait</option>
                          <option value="Très insatisfait">Très insatisfait</option>
                          <option value="Neutre">Neutre</option>
                          <option value="Avec observations">Avec observations</option>
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
                          className="p-2 border rounded w-full min-h-[40px] resize-none overflow-hidden"
                          placeholder="Commentaire"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="flex flex-col gap-2">
                          {row.photo ? (
                            <div className="flex items-center gap-2">
                              <img src={row.photo} alt="aperçu" className="h-12 w-12 object-cover rounded border" />
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
                                if (!ok) { alert('Formats acceptés: PNG, JPG'); e.target.value=''; return; }
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
                                if (!processed) { alert('Erreur lors du traitement de l\'image'); return; }
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
          <div className="mt-6">
            <h4 className="text-base font-semibold text-blue-600 mb-2">AUTRES POINTS</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-3 py-2 text-left">Chapitre</th>
                    <th className="px-3 py-2 text-left">Élément observé</th>
                    <th className="px-3 py-2 text-left">Moyen de contrôle</th>
                    <th className="px-3 py-2 text-left">Avis</th>
                    <th className="px-3 py-2 text-left">Commentaire</th>
                    <th className="px-3 py-2 text-left">Photo</th>
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
                          className="p-2 border rounded w-full uppercase"
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
                          className="p-2 border rounded w-full min-h-[40px] resize-none overflow-hidden"
                          placeholder="Élément observé"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <textarea
                          value={row.moyen || row.moyenDeControle || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.autresPoints || [])];
                            next[idx] = { ...(next[idx] || {}), moyen: e.target.value };
                            return { ...prev, autresPoints: next };
                          })}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                          className="p-2 border rounded w-full min-h-[40px] resize-none overflow-hidden"
                          placeholder="Moyen de contrôle"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <select
                          value={row.avis || ''}
                          onChange={(e) => setForm(prev => {
                            const next = [...(prev.autresPoints || [])];
                            next[idx] = { ...(next[idx] || {}), avis: e.target.value };
                            return { ...prev, autresPoints: next };
                          })}
                          className={`p-2 border rounded w-full bg-white ${getAvisColorClass(row.avis)}`}
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Conforme">Conforme</option>
                          <option value="Non conforme">Non conforme</option>
                          <option value="Très satisfait">Très satisfait</option>
                          <option value="Satisfait">Satisfait</option>
                          <option value="Insatisfait">Insatisfait</option>                        
                          <option value="Très insatisfait">Très insatisfait</option>
                          <option value="Neutre">Neutre</option>
                          <option value="Avec observations">Avec observations</option>

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
                          className="p-2 border rounded w-full min-h-[40px] resize-none overflow-hidden"
                          placeholder="Commentaire"
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="flex flex-col gap-2">
                          {row.photo ? (
                            <div className="flex items-center gap-2">
                              <img src={row.photo} alt="aperçu" className="h-12 w-12 object-cover rounded border" />
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
                                if (!ok) { alert('Formats acceptés: PNG, JPG'); e.target.value=''; return; }
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

          {/* CONCLUSION (placée après le tableau AUTRES POINTS) */}
          <div className="mt-6">
            <h4 className="text-base font-semibold text-blue-600 mb-2">Conclusion</h4>
            <textarea
              name="conclusion"
              value={form.conclusion || ''}
              onChange={handleChange}
              className="p-2 border rounded min-h-[140px] resize-y w-full"
              placeholder="Saisissez la conclusion..."
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 mt-1"></div>
          </div>
        </div>
      )}
      {/* Visibilité (public/privé) retirée de l'UI; par défaut, visible */}
      {/* Section Pièces jointes, Checklist QA, Problèmes/Solutions retirées */}

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          {showStep2 ? 'Ajouter Rapport' : 'Continuer'}
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
            adresseOuvrage: "",
            private: false,
            status: 'En cours',
          }); setShowStep2(false); setNewIntervenant(''); }}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
        >
          Réinitialiser
        </button>
      </div>
    </form>
  );
}
