"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FileText, Building2, ArrowRight, Mail } from "lucide-react";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent";

export default function BienvenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && session?.user?.entrepriseId) {
      router.push("/dashboard-projet");
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center" role="status" aria-label="Chargement">
        <div className="w-8 h-8 border-[3px] border-app-border border-t-app-accent rounded-full animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  const prenom = session?.user?.name?.split(" ")[0];

  return (
    <main className="min-h-screen bg-app-bg text-app-text flex items-center justify-center px-4 py-12 sm:px-6">
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="mb-10 sm:mb-12">
          <p className="flex items-center gap-2 font-data text-sm uppercase tracking-[0.14em] text-app-muted">
            <span aria-hidden="true" className="w-2.5 h-2.5 bg-app-accent" />
            PROJECTRA
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02] tracking-[-0.035em]">
            {prenom ? `Bienvenue, ${prenom}.` : "Bienvenue sur PROJECTRA."}
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-app-muted leading-snug">
            Par quoi voulez-vous commencer&nbsp;?
          </p>
        </div>

        {/* Choix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Rapports d'inspection */}
          <section className="flex flex-col rounded-2xl bg-app-surface border border-app-border p-7 sm:p-8 hover:border-app-border-strong transition-colors">
            <div className="w-14 h-14 rounded-xl bg-app-subtle border border-app-border flex items-center justify-center">
              <FileText aria-hidden="true" className="w-7 h-7 text-app-text" />
            </div>
            <p className="mt-6 font-data text-sm uppercase tracking-[0.12em] text-app-faint">Compte individuel</p>
            <h2 className="mt-2 text-2xl sm:text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              Rapports d&apos;inspection
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-app-muted flex-1">
              Créez des rapports d&apos;inspection BTP professionnels. Un rapport gratuit, puis abonnement.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`btn btn-soft mt-8 w-full sm:w-auto self-start text-base ${focusRing}`}
            >
              Créer mon premier rapport <ArrowRight aria-hidden="true" className="w-5 h-5" />
            </button>
          </section>

          {/* Gestion de chantier */}
          <section className="flex flex-col rounded-2xl bg-app-surface border border-app-border p-7 sm:p-8 hover:border-app-border-strong transition-colors">
            <div className="w-14 h-14 rounded-xl bg-app-accent-soft flex items-center justify-center">
              <Building2 aria-hidden="true" className="w-7 h-7 text-app-accent-text" />
            </div>
            <p className="mt-6 font-data text-sm uppercase tracking-[0.12em] text-app-faint">Entreprise</p>
            <h2 className="mt-2 text-2xl sm:text-[28px] font-semibold leading-tight tracking-[-0.02em]">
              Gestion de chantier
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-app-muted flex-1">
              Gérez vos chantiers, équipes, budgets et rapports au même endroit. Essai gratuit de 7&nbsp;jours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/inscription")}
                className={`btn btn-primary text-base ${focusRing}`}
              >
                Créer mon entreprise <ArrowRight aria-hidden="true" className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/demo")}
                className={`btn btn-soft text-base ${focusRing}`}
              >
                Voir la démo
              </button>
            </div>
          </section>
        </div>

        {/* Invitation */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-app-border bg-app-subtle px-5 py-4">
          <Mail aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0 text-app-muted" />
          <p className="text-base text-app-muted">
            <span className="font-semibold text-app-text">Vous avez reçu une invitation&nbsp;?</span>{" "}
            Ouvrez le lien reçu par email pour rejoindre directement votre entreprise.
          </p>
        </div>
      </div>
    </main>
  );
}
