// components/ReportForm.jsx
"use client";
import { useState, useEffect } from "react";

export default function ReportForm({ addReport, reportToEdit, onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(
    reportToEdit || {
      entreprise: "SGTEC L'OEIL DU BATIMENT",
      chantier: "",
      dateDebut: "",
      dateFin: "",
      responsable: "",
      proprietaire: "",
      localisation: "",
      adresseOuvrage: "",
      avancement: "",
      avancementPourcentage: 0,
      observations: "",
      meteo: {
        condition: "", // ensoleillé, nuageux, pluvieux, etc.
        temperature: "",
        impact: "" // impact sur le chantier
      },
      pointsVigilance: "",
      contraintesParticulieres: "",
      securiteConformite: {
        equipementsPresents: false,
        signalisationConforme: false,
        epi: false,
        remarques: ""
      },
      intervenants: [], // liste des personnes présentes sur le chantier
      problemesRencontres: "",
      solutionsApportees: "",
      planningPrevisionnel: "",
      status: 'En cours',
      checklist_ok: false,
      attachments: [], // { id, dataUrl, caption }
    }
  );
  const [errors, setErrors] = useState([]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validateStep1 = (data) => {
    const missing = [];
    if (!data.chantier || data.chantier.trim() === '') missing.push('Chantier');
    if (!data.responsable || data.responsable.trim() === '') missing.push('Responsable');
    if (!data.dateDebut || data.dateDebut.trim() === '') missing.push('Date début');
    return missing;
  };

  const validateStep2 = (data) => {
    const missing = [];
    if (!data.proprietaire || data.proprietaire.trim() === '') missing.push('Propriétaire');
    if (!data.adresseChantier || data.adresseChantier.trim() === '') missing.push("Adresse de l'ouvrage");
    if (!data.observations || data.observations.trim() === '') missing.push('Observations');
    if (!data.checklist_ok) missing.push('Checklist QA');
    return missing;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = validateStep2(form);
    if (missing.length) {
      setErrors(missing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);
    addReport(form);
    setStep(1);
    setForm({
      entreprise: "SGTEC L'OEIL DU BATIMENT",
      chantier: "",
      dateDebut: "",
      dateFin: "",
      responsable: "",
      proprietaire: "",
      adresseOuvrage: "",
      avancement: "",
      avancementPourcentage: 0,
      observations: "",
      meteo: {
        condition: "",
        temperature: "",
        impact: ""
      },
      pointsVigilance: "",
      contraintesParticulieres: "",
      securiteConformite: {
        equipementsPresents: false,
        signalisationConforme: false,
        epi: false,
        remarques: ""
      },
      intervenants: [],
      problemesRencontres: "",
      solutionsApportees: "",
      planningPrevisionnel: "",
      status: 'En cours',
      checklist_ok: false,
      attachments: []
    });
  };

  // Convert file to data URL (base64)
  const fileToDataUrl = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const converted = [];
    for (const f of files) {
      try {
        const dataUrl = await fileToDataUrl(f);
        converted.push({ id: `att_${Date.now()}_${Math.floor(Math.random()*10000)}`, dataUrl, caption: '' });
      } catch (err) {
        console.error('Erreur conversion fichier', err);
      }
    }
    setForm(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...converted] }));
    // reset input value
    e.target.value = '';
  };

  const updateAttachmentCaption = (id, caption) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.map(a => a.id === id ? { ...a, caption } : a)
    }));
  };

  const removeAttachment = (id) => {
    setForm(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
  };

  // Mettre à jour le formulaire quand reportToEdit change
  useEffect(() => {
    if (reportToEdit) {
      setForm(reportToEdit);
    }
  }, [reportToEdit]);

  const handleContinue = (e) => {
    e.preventDefault();
    const missing = validateStep1(form);
    if (missing.length) {
      setErrors(missing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    setStep(2);
  };

  const handleBack = () => {
    console.log('Retour clicked - current step:', step);
    setStep(1);
    setErrors([]);
    console.log('New step should be 1');
  };

  const step1Fields = ['entreprise', 'chantier', 'dateDebut', 'dateFin', 'responsable'];
  const step2Fields = [
    'proprietaire', 
    'adresseOuvrage', 
    'avancement',
    'avancementPourcentage',
    'meteo',
    'observations',
    'pointsVigilance',
    'contraintesParticulieres',
    'securiteConformite',
    'intervenants',
    'problemesRencontres',
    'solutionsApportees',
    'planningPrevisionnel',
    'status', 
    'checklist_ok', 
    'attachments'
  ];

  return (
    <form
      onSubmit={step === 1 ? handleContinue : handleSubmit}
      className="bg-white p-6 rounded-xl shadow-lg grid gap-6"
      data-step={step} // Ajout d'un attribut pour vérifier l'état actuel
    >
      {errors.length > 0 && (
        <div className="p-2 bg-red-50 border border-red-100 text-red-700 rounded">
          Champs obligatoires manquants: {errors.join(', ')}
        </div>
      )}

      {/* Barre de progression */}
      <div className="flex items-center mb-4">
        <div className={`h-2 flex-1 rounded-l ${step === 1 ? 'bg-blue-500' : 'bg-green-500'}`}></div>
        <div className={`h-2 flex-1 rounded-r ${step === 1 ? 'bg-gray-200' : 'bg-blue-500'}`}></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {(step === 1 ? step1Fields : step2Fields).map((key) => {
          const isLongField = ["observations", "avancement", "pointsVigilance", "contraintesParticulieres", "problemesRencontres", "solutionsApportees", "planningPrevisionnel"].includes(key);
          const isFullWidth = isLongField || key === "meteo" || key === "securiteConformite";
          return (
            <div key={key} className={`flex flex-col ${isFullWidth ? "lg:col-span-3 md:col-span-2" : ""}`}>
              <label className="font-semibold capitalize whitespace-nowrap">{key === 'adresseOuvrage' ? "Adresse de l'ouvrage" : key.replace(/([A-Z])/g, " $1")}</label>
              {key === "meteo" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select
                      name="meteo.condition"
                      value={form.meteo.condition}
                      onChange={(e) => setForm({...form, meteo: {...form.meteo, condition: e.target.value}})}
                      className="p-2 border rounded w-full"
                    >
                      <option value="">Sélectionnez la météo</option>
                      <option value="ensoleille">Ensoleillé</option>
                      <option value="nuageux">Nuageux</option>
                      <option value="pluvieux">Pluvieux</option>
                      <option value="orageux">Orageux</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Température"
                      name="meteo.temperature"
                      value={form.meteo.temperature}
                      onChange={(e) => setForm({...form, meteo: {...form.meteo, temperature: e.target.value}})}
                      className="p-2 border rounded w-full"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Impact sur le chantier"
                      name="meteo.impact"
                      value={form.meteo.impact}
                      onChange={(e) => setForm({...form, meteo: {...form.meteo, impact: e.target.value}})}
                      className="p-2 border rounded w-full h-20"
                    />
                  </div>
                </div>
              ) : key === "securiteConformite" ? (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="securiteConformite.equipementsPresents"
                        checked={form.securiteConformite.equipementsPresents}
                        onChange={(e) => setForm({...form, securiteConformite: {...form.securiteConformite, equipementsPresents: e.target.checked}})}
                        className="w-4 h-4"
                      />
                      <span>Équipements présents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="securiteConformite.signalisationConforme"
                        checked={form.securiteConformite.signalisationConforme}
                        onChange={(e) => setForm({...form, securiteConformite: {...form.securiteConformite, signalisationConforme: e.target.checked}})}
                        className="w-4 h-4"
                      />
                      <span>Signalisation conforme</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="securiteConformite.epi"
                        checked={form.securiteConformite.epi}
                        onChange={(e) => setForm({...form, securiteConformite: {...form.securiteConformite, epi: e.target.checked}})}
                        className="w-4 h-4"
                      />
                      <span>EPI portés par tous</span>
                    </div>
                  </div>
                  <textarea
                    placeholder="Remarques sur la sécurité"
                    name="securiteConformite.remarques"
                    value={form.securiteConformite.remarques}
                    onChange={(e) => setForm({...form, securiteConformite: {...form.securiteConformite, remarques: e.target.value}})}
                    className="p-2 border rounded w-full h-20"
                  />
                </div>
              ) : key === "avancementPourcentage" ? (
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    name={key}
                    value={form[key] || 0}
                    onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value, 10) })}
                    className="flex-1"
                  />
                  <span className="w-16 text-center font-bold">{form[key] || 0}%</span>
                </div>
              ) : isLongField ? (
                <>
                  <textarea
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    className="p-2 border rounded min-h-[100px] resize-y"
                    placeholder={`Entrez vos ${key.replace(/([A-Z])/g, " $1").toLowerCase()}...`}
                    maxLength={2000}
                  />
                  {key === 'observations' && (
                    <div className="text-xs text-gray-500 mt-1">{form.observations.length}/2000</div>
                  )}
                </>
              ) : key === 'status' ? (
                <select
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  className="p-2 border rounded"
                >
                  <option value="En cours">En cours</option>
                  <option value="En attente">En attente</option>
                  <option value="Terminé">Terminé</option>
                </select>
              ) : key === 'checklist_ok' ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name={key} 
                    checked={form[key]} 
                    onChange={(e) => setForm({...form, [key]: e.target.checked})} 
                  />
                  <span className="text-sm">Checklist QA (photos, signature, validations)</span>
                </div>
              ) : (
                <input
                  type={key === "dateDebut" || key === "dateFin" ? "date" : "text"}
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  className="p-2 border rounded"
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Attachments upload and previews */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-semibold">Photos / Pièces jointes</label>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          {(form.attachments || []).map(att => (
            <div key={att.id} className="w-36 card">
              <img src={att.dataUrl} alt="attachment" className="w-full h-24 object-cover rounded" />
              <input
                type="text"
                placeholder="Légende"
                value={att.caption}
                onChange={(e) => updateAttachmentCaption(att.id, e.target.value)}
                className="p-1 mt-1 border rounded w-full text-sm"
              />
              <div className="flex justify-end mt-1">
                <button type="button" onClick={() => removeAttachment(att.id)} className="text-sm text-red-500">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {step === 1 ? (
          <>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setForm({
                entreprise: "SGTEC L'OEIL DU BATIMENT",
                chantier: "",
                dateDebut: "",
                dateFin: "",
                responsable: "",
                proprietaire: "",
                quartierChantier: "",
                adresseOuvrage: "",
                avancement: "",
                observations: "",
                status: 'En cours',
                checklist_ok: false,
                meteo: {
                  condition: "",
                  temperature: "",
                  impact: ""
                },
                securiteConformite: {
                  equipementsPresents: false,
                  signalisationConforme: false,
                  epi: false,
                  remarques: ""
                },
                attachments: []
              })}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
            >
              Réinitialiser
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleBack}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Retour
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Ajouter Rapport
            </button>
          </>
        )}
      </div>
    </form>
  );
}
