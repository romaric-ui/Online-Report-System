"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusCircle, ArrowLeft, DollarSign } from "lucide-react";
import { PAYS_LIST } from "../../../../lib/countries";

export default function NouveauChantierPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState({
    nature_travaux: "",
    reference: "",
    client_nom: "",
    client_telephone: "",
    client_email: "",
    adresse: "",
    ville: "",
    pays: "",
    date_debut: "",
    date_fin_prevue: "",
    budget_prevu: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const handleChange = (field) => (e) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.nature_travaux) {
      setError("La nature des travaux est requise.");
      return;
    }
    if (values.nature_travaux === "Autre" && !values.description.trim()) {
      setError("Veuillez préciser la nature des travaux.");
      return;
    }
    if (
      values.date_debut &&
      values.date_fin_prevue &&
      values.date_fin_prevue < values.date_debut
    ) {
      setError(
        "La date de fin doit être supérieure ou égale à la date de début.",
      );
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/chantiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          nom: values.nature_travaux,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(
          result.error?.message || "Erreur lors de la création du chantier",
        );
      router.push(`/chantiers/${result.data.id_chantier}`);
    } catch (err) {
      setError(err.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <button
          type="button"
          onClick={() => router.push("/chantiers")}
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition hover:opacity-70"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--bg-surface)",
            boxShadow: "var(--shadow-neu-raised)",
          }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div
              className="rounded-2xl p-4 text-white"
              style={{
                background: "linear-gradient(145deg, #6366F1, #4F46E5)",
                boxShadow: "6px 6px 12px rgba(79,70,229,0.35)",
              }}
            >
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Nouveau chantier
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Renseignez les informations du chantier pour le créer.
              </p>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl p-4 mb-6 text-sm font-medium"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "var(--color-danger)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="input-neu-label">Nature des travaux *</span>
                <select
                  value={values.nature_travaux}
                  onChange={handleChange("nature_travaux")}
                  className="select-neu"
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <optgroup label="Bâtiment et Logement">
                    <option>Construction neuve</option>
                    <option>Rénovation complète</option>
                    <option>Extension / Agrandissement</option>
                    <option>Surélévation</option>
                    <option>Réhabilitation</option>
                    <option>Démolition</option>
                  </optgroup>
                  <optgroup label="Travaux Extérieurs">
                    <option>Terrassement</option>
                    <option>Aménagement paysager</option>
                    <option>Ravalement de façade</option>
                    <option>Réfection de toiture</option>
                  </optgroup>
                  <optgroup label="Génie Civil et Infrastructures">
                    <option>Voirie et Réseaux Divers (VRD)</option>
                    <option>Ouvrage d'art (pont, tunnel, barrage)</option>
                    <option>Assainissement</option>
                    <option>Adduction d'eau potable</option>
                    <option>Électrification</option>
                  </optgroup>
                  <optgroup label="Aménagement Intérieur">
                    <option>Plomberie</option>
                    <option>Électricité</option>
                    <option>Climatisation / Ventilation</option>
                    <option>Menuiserie</option>
                    <option>Carrelage / Revêtement de sol</option>
                    <option>Peinture</option>
                  </optgroup>
                  <optgroup label="Industriel et Spécialisé">
                    <option>Construction industrielle</option>
                    <option>Installation d'équipements</option>
                    <option>Sécurité incendie</option>
                  </optgroup>
                  <option value="Autre">Autre</option>
                </select>
                {values.nature_travaux === "Autre" && (
                  <label className="space-y-1.5">
                    <span className="input-neu-label">
                      Précisez la nature des travaux *
                    </span>
                    <textarea
                      value={values.description}
                      onChange={handleChange("description")}
                      rows={3}
                      className="textarea-neu"
                      placeholder="Décrivez la nature des travaux..."
                      required
                    />
                  </label>
                )}
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Référence</span>
                <input
                  value={values.reference}
                  onChange={handleChange("reference")}
                  className="input-neu"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="input-neu-label">Client</span>
                <input
                  value={values.client_nom}
                  onChange={handleChange("client_nom")}
                  className="input-neu"
                />
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Téléphone client</span>
                <input
                  type="tel"
                  value={values.client_telephone}
                  onChange={handleChange("client_telephone")}
                  className="input-neu"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="input-neu-label">Email client</span>
                <input
                  type="email"
                  value={values.client_email}
                  onChange={handleChange("client_email")}
                  className="input-neu"
                />
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Adresse</span>
                <input
                  value={values.adresse}
                  onChange={handleChange("adresse")}
                  className="input-neu"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="input-neu-label">Ville</span>
                <input
                  value={values.ville}
                  onChange={handleChange("ville")}
                  className="input-neu"
                />
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Pays</span>
                <select
                  value={values.pays}
                  onChange={handleChange("pays")}
                  className="select-neu"
                >
                  <option value="">-- Sélectionner un pays --</option>
                  {PAYS_LIST.map(({ code, nom }) => (
                    <option key={code} value={nom}>
                      {nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Budget prévu</span>
                <div className="relative">
                  <DollarSign
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                  <input
                    type="number"
                    value={values.budget_prevu}
                    onChange={handleChange("budget_prevu")}
                    className="input-neu"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="input-neu-label">Date de début</span>
                <input
                  type="date"
                  value={values.date_debut}
                  onChange={handleChange("date_debut")}
                  className="input-neu"
                />
              </label>
              <label className="space-y-1.5">
                <span className="input-neu-label">Date fin prévue</span>
                <input
                  type="date"
                  value={values.date_fin_prevue}
                  onChange={handleChange("date_fin_prevue")}
                  className="input-neu"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push("/chantiers")}
                className="btn btn-soft px-6 py-3"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? "Création..." : "Créer le chantier"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
