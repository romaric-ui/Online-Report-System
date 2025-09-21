// components/ReportForm.jsx
"use client";
import { useState, useEffect } from "react";

export default function ReportForm({ addReport, reportToEdit, onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(
    reportToEdit || {
      entreprise: "SGTEC L'OEIL DU BATIMENT",
      chantier: "RAPPORT D'INVESTIGATION AUDIT DE CLOS COUVERT: INVESTIGATION DE CHANTIER",
      phase: "",
      noAffaire: "",
      noRapport: "",
      intervenant: "",
      dateIntervention: "",
      proprietaire: "",
      maitreOuvrage: "",
      centreTravaux: "",
      coverImage: "",

      adresseOuvrage: "",
      private: false,
      intervenants: [], // liste des personnes présentes sur le chantier
      status: 'En cours',
      
    }
  );
  const [errors, setErrors] = useState([]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validateStep1 = (data) => {
    const missing = [];
    const phaseEmpty = data.phase === undefined || data.phase === null || String(data.phase).trim() === '';
    const phaseInvalid = !phaseEmpty && Number.isFinite(Number(data.phase)) ? Number(data.phase) < 1 : phaseEmpty;
    if (phaseEmpty || phaseInvalid) missing.push('Phase');
    return missing;
  };

  const validateStep2 = (data) => {
    const missing = [];
    if (!data.proprietaire || data.proprietaire.trim() === '') missing.push('Propriétaire');
    if (!data.adresseOuvrage || data.adresseOuvrage.trim() === '') missing.push("Adresse de l'ouvrage");
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
      chantier: "RAPPORT D'INVESTIGATION AUDIT DE CLOS COUVERT: INVESTIGATION DE CHANTIER",
      phase: "",
      noAffaire: "",
      noRapport: "",
      intervenant: "",
      dateIntervention: "",
      proprietaire: "",
      maitreOuvrage: "",
      centreTravaux: "",
      coverImage: "",
      adresseOuvrage: "",
      private: false,
      intervenants: [],
      status: 'En cours',
      
    });
  };

  // Attachments, checklist, problèmes/solutions supprimés

  // Mettre à jour le formulaire quand reportToEdit change
  useEffect(() => {
    if (reportToEdit) {
      // Merge into defaults to avoid undefined values in inputs
      setForm((prev) => ({ ...prev, ...reportToEdit }));
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

  const step1Fields = ['entreprise', 'phase', 'noAffaire', 'noRapport', 'intervenant', 'dateIntervention', 'coverImage'];
  const step2Fields = [
    'centreTravaux',
    'maitreOuvrage',
    'adresseOuvrage', 
    'proprietaire', 
    'intervenants',
    'status', 
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
          const isLongField = [].includes(key);
          const isFullWidth = isLongField;
          return (
            <div key={key} className={`flex flex-col ${isFullWidth ? "lg:col-span-3 md:col-span-2" : ""}`}>
              <label className="font-semibold capitalize whitespace-nowrap">{
                key === 'adresseOuvrage' ? "Adresse de l'ouvrage" :
                key === 'dateIntervention' ? "Date d'Intervention" :
                key === 'noAffaire' ? "N° affaire" :
                key === 'noRapport' ? "N° Rapport" :
                key === 'intervenant' ? "Intervenant" :
                key === 'maitreOuvrage' ? "Maître d'ouvrage" :
                key === 'centreTravaux' ? "Centre de Travaux" :
                key === 'coverImage' ? "Image de couverture" :
                key.replace(/([A-Z])/g, " $1")
              }</label>
              {isLongField ? (
                <>
                  <textarea
                    name={key}
                    value={form[key] ?? ''}
                    onChange={handleChange}
                    className="p-2 border rounded min-h-[100px] resize-y"
                    placeholder={`Entrez vos ${key.replace(/([A-Z])/g, " $1").toLowerCase()}...`}
                    maxLength={2000}
                  />
                  {/* compteur supprimé avec le champ observations */}
                </>
              ) : key === 'coverImage' ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setForm({ ...form, coverImage: '' });
                        return;
                      }
                      const type = (file.type || '').toLowerCase();
                      const name = (file.name || '').toLowerCase();
                      const allowed = type === 'image/png' || type === 'image/jpeg' || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
                      if (!allowed) {
                        alert('Format non pris en charge. Formats autorisés: PNG, JPG, JPEG.');
                        e.target.value = '';
                        setForm({ ...form, coverImage: '' });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => setForm({ ...form, coverImage: reader.result });
                      reader.readAsDataURL(file);
                    }}
                    className="p-2 border rounded"
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
                  className="p-2 border rounded"
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
                  className="p-2 border rounded"
                  placeholder="Numéro de phase"
                />
              ) : (
                <input
                  type={key === 'phase' ? 'number' : key === 'dateIntervention' ? 'date' : 'text'}
                  name={key}
                  value={form[key] ?? ''}
                  onChange={handleChange}
                  className="p-2 border rounded"
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Visibilité (public/privé) retirée de l'UI; par défaut, visible */}
      {/* Section Pièces jointes, Checklist QA, Problèmes/Solutions retirées */}

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
                chantier: "RAPPORT D'INVESTIGATION AUDIT DE CLOS COUVERT: INVESTIGATION DE CHANTIER",
                phase: "",
                noAffaire: "",
                noRapport: "",
                intervenant: "",
                dateIntervention: "",
                proprietaire: "",
                adresseOuvrage: "",
                status: 'En cours',
                private: false,
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
