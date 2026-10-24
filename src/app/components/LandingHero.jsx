"use client";
import { ArrowRight, Play } from "lucide-react";
import { Eyebrow } from "./LandingKit";

const STATS = [
  { value: "500+", label: "chantiers gérés" },
  { value: "2 000+", label: "rapports générés" },
  { value: "98 %", label: "clients satisfaits" },
];

export default function LandingHero({ onGetStarted }) {
  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden bg-nuit -mt-[76px]">
      {/* Vidéo plein cadre */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
      >
        <source src="/videos/chantier.mp4" type="video/mp4" />
      </video>
      {/* Voile : lisibilité du texte à gauche, fondu vers la section suivante */}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,15,19,.92)_0%,rgba(11,15,19,.72)_38%,rgba(11,15,19,.15)_75%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,#0B0F13,transparent)]" />

      <div className="relative z-10 flex-1 flex items-center w-full max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <div className="max-w-5xl">
          <div className="lk-rise" style={{ animationDelay: "0ms" }}>
            <Eyebrow index={1} label="Terrain" />
          </div>

          <h1
            className="lk-rise mt-6 font-ui font-semibold text-craie text-[clamp(2.75rem,6.6vw,6.25rem)] leading-[0.95] tracking-[-0.035em]"
            style={{ animationDelay: "80ms" }}
          >
            <span className="block sm:whitespace-nowrap">Pilotez vos chantiers.</span>
            <span className="block sm:whitespace-nowrap text-craie-2">Sans compromis.</span>
          </h1>

          <p
            className="lk-rise mt-7 max-w-[34rem] text-lg sm:text-xl leading-relaxed text-craie-2"
            style={{ animationDelay: "160ms" }}
          >
            Suivi en temps réel, équipes, budget, planning et sécurité : tout
            ce que le terrain remonte, au même endroit, pour les pros du BTP.
          </p>

          <div
            className="lk-rise mt-10 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <button
              type="button"
              onClick={onGetStarted}
              className="lk-focus group inline-flex items-center justify-center gap-2 whitespace-nowrap h-14 px-8 rounded-full bg-orange-vif text-nuit text-base font-semibold transition-colors hover:bg-[#FF8A47]"
            >
              Démarrer gratuitement
              <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/demo")}
              className="lk-focus inline-flex items-center justify-center gap-2.5 whitespace-nowrap h-14 px-7 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-md text-craie text-base font-medium transition-colors hover:bg-white/[0.12]"
            >
              <Play className="w-4 h-4 fill-current" />
              Voir la démo en direct
            </button>
            <button
              type="button"
              onClick={() =>
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }
              className="lk-focus inline-flex items-center justify-center whitespace-nowrap h-14 px-4 rounded-full text-craie-2 text-base font-medium underline-offset-[6px] hover:text-craie hover:underline"
            >
              Voir les fonctionnalités
            </button>
          </div>

          <ul
            className="lk-rise mt-14 flex flex-wrap gap-2"
            style={{ animationDelay: "320ms" }}
          >
            {STATS.map(({ value, label }) => (
              <li
                key={label}
                className="inline-flex items-baseline gap-2 h-10 px-4 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-md text-[15px] text-craie-2"
              >
                <span className="font-semibold text-craie">{value}</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Indice de défilement */}
      <div aria-hidden="true" className="relative z-10 hidden md:flex items-center gap-3 max-w-7xl w-full mx-auto px-8 pb-8 font-data text-[12px] uppercase tracking-[0.18em] text-craie-3">
        <span className="h-px w-10 bg-white/25" />
        Faites défiler
      </div>
    </section>
  );
}
