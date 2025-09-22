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

      objectifLimites: "",
      ouvrageConcerne: "",
      deroulementVisite: "",

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
      objectifLimites: "",
      ouvrageConcerne: "",
      deroulementVisite: "",
      // reset des détails ouvrage
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
    'entreprise', 'phase', 'noAffaire', 'noRapport', 'intervenants', 'dateIntervention', 'coverImage',
    'centreTravaux', 'maitreOuvrage', 'adresseOuvrage', 'proprietaire', 'status',
    'objectifLimites', 'ouvrageConcerne', 'deroulementVisite'
  ];

  // Regroupement visuel: les 3 champs de la "deuxième partie" après la page de garde
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

      {/* Barre de progression supprimée */}

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
                      if (!file) {
                        setForm({ ...form, coverImage: '', coverImageWidth: undefined, coverImageHeight: undefined });
                        return;
                      }
                      const type = (file.type || '').toLowerCase();
                      const name = (file.name || '').toLowerCase();
                      const allowed = type === 'image/png' || type === 'image/jpeg' || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
                      if (!allowed) {
                        alert('Format non pris en charge. Formats autorisés: PNG, JPG, JPEG.');
                        e.target.value = '';
                        setForm({ ...form, coverImage: '', coverImageWidth: undefined, coverImageHeight: undefined });
                        return;
                      }

                      async function processImage(f) {
                        const isPng = (f.type || '').toLowerCase().includes('png') || (f.name || '').toLowerCase().endsWith('.png');
                        const maxDim = 2000;
                        try {
                          if ('createImageBitmap' in window) {
                            const bitmap = await createImageBitmap(f, { imageOrientation: 'from-image' });
                            let { width, height } = bitmap;
                            const ratio = width / height;
                            let targetW = width;
                            let targetH = height;
                            if (Math.max(width, height) > maxDim) {
                              if (width >= height) {
                                targetW = maxDim;
                                targetH = Math.round(maxDim / ratio);
                              } else {
                                targetH = maxDim;
                                targetW = Math.round(maxDim * ratio);
                              }
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = targetW;
                            canvas.height = targetH;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(bitmap, 0, 0, targetW, targetH);
                            const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.95);
                            try { bitmap.close && bitmap.close(); } catch {}
                            return { dataUrl, width: targetW, height: targetH };
                          }
                        } catch {}

                        // Fallback sans EXIF
                        const objectUrl = URL.createObjectURL(f);
                        const img = new Image();
                        const result = await new Promise((resolve, reject) => {
                          img.onload = () => {
                            try {
                              const width = img.naturalWidth;
                              const height = img.naturalHeight;
                              const ratio = width / height;
                              let targetW = width;
                              let targetH = height;
                              if (Math.max(width, height) > maxDim) {
                                if (width >= height) {
                                  targetW = maxDim;
                                  targetH = Math.round(maxDim / ratio);
                                } else {
                                  targetH = maxDim;
                                  targetW = Math.round(maxDim * ratio);
                                }
                              }
                              const canvas = document.createElement('canvas');
                              canvas.width = targetW;
                              canvas.height = targetH;
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(img, 0, 0, targetW, targetH);
                              const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.95);
                              resolve({ dataUrl, width: targetW, height: targetH });
                            } catch (err) {
                              reject(err);
                            } finally {
                              URL.revokeObjectURL(objectUrl);
                            }
                          };
                          img.onerror = (err) => {
                            URL.revokeObjectURL(objectUrl);
                            reject(err);
                          };
                          img.src = objectUrl;
                        });
                        return result;
                      }

                      try {
                        const processed = await processImage(file);
                        setForm({ ...form, coverImage: processed.dataUrl, coverImageWidth: processed.width, coverImageHeight: processed.height });
                      } catch (err) {
                        console.error('Erreur traitement image:', err);
                        const reader = new FileReader();
                        reader.onloadend = () => setForm({ ...form, coverImage: reader.result, coverImageWidth: undefined, coverImageHeight: undefined });
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="p-2 border rounded w-full"
                  />
                  <div className="text-xs text-gray-500">Formats acceptés: PNG, JPG, JPEG</div>
                  {form.coverImage && (
                    <img src={form.coverImage} alt="aperçu" className="h-24 w-auto rounded border" />
                  )}
                </div>
              ) : key === 'status' ? (
                <select
                  name={key}
                  value={form[key] ?? 'En cours'}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                >
                  <option value="En cours">En cours</option>
                  <option value="En attente">En attente</option>
                  <option value="Terminé">Terminé</option>
                </select>
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
              const isLongField = true;
              const isFullWidth = true; // ces champs doivent occuper toute la largeur
              const labelText = (
                key === 'objectifLimites' ? "Objectif et limites de la prestation" :
                key === 'ouvrageConcerne' ? "Ouvrage concerné" :
                key === 'deroulementVisite' ? "Déroulement de la visite" :
                key.replace(/([A-Z])/g, " $1")
              );
              return (
                <div key={key} className={`flex flex-col min-w-0 ${isFullWidth ? "lg:col-span-3 md:col-span-2" : ""}`}>
                  <label className="font-semibold capitalize mb-1 break-words">{labelText}</label>
                  {isLongField && (
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
                  )}
                </div>
              );
            })}
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
            objectifLimites: "",
            ouvrageConcerne: "",
            deroulementVisite: "",
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
