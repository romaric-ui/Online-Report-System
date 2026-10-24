"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

// Photos de chantier provisoires (captures déposées dans public/images)
const photo = (time) => encodeURI(`/images/Capture d'écran 2026-10-24 ${time}.png`);

// Chaque section a sa propre composition (layout) et son voile de lisibilité (veil).
// Sur mobile, toutes retombent en bas à gauche.
const SLIDES = [
  {
    id: "suivi",
    layout: "bas-gauche",
    label: "Suivi de chantier",
    title: "Chaque chantier, en temps réel.",
    text: "Avancement, équipes et incidents remontent du terrain au bureau, sans attendre la réunion de chantier.",
    image: photo("165426"),
    position: "center",
    veil: "linear-gradient(90deg,rgba(11,15,19,.92) 0%,rgba(11,15,19,.55) 45%,rgba(11,15,19,.05) 85%)",
    primary: { label: "Démarrer gratuitement", action: "start" },
    secondary: { label: "Voir la démo en direct", action: "demo" },
  },
  {
    id: "rapports",
    layout: "haut-droite",
    label: "Rapports journaliers",
    title: "Le rapport du jour, bouclé sur place.",
    text: "Météo, effectifs, travaux réalisés et photos : le rapport se remplit sur tablette et part en PDF le soir même.",
    image: photo("162949"),
    position: "center 70%",
    veil: "linear-gradient(270deg,rgba(11,15,19,.92) 0%,rgba(11,15,19,.55) 45%,rgba(11,15,19,.1) 85%)",
    primary: { label: "Démarrer gratuitement", action: "start" },
    secondary: { label: "Voir les fonctionnalités", action: "features" },
  },
  {
    id: "budget",
    layout: "eclate",
    label: "Budget et planning",
    title: "Budget et planning, sous contrôle.",
    text: "Dépenses et jalons comparés au prévisionnel, pour repérer les dérives avant qu'elles ne coûtent.",
    image: photo("165408"),
    position: "center",
    veil: "linear-gradient(180deg,rgba(11,15,19,.85) 0%,rgba(11,15,19,.25) 45%,rgba(11,15,19,.9) 100%)",
    primary: { label: "Démarrer gratuitement", action: "start" },
    secondary: { label: "Comment ça marche", action: "how" },
  },
  {
    id: "demo",
    layout: "plein-cadre",
    label: "Démonstration",
    title: "Voyez-le sur un vrai chantier.",
    text: "Parcourez un chantier complet, de ses rapports à son budget, avant de vous lancer.",
    image: photo("163813"),
    position: "center 40%",
    veil: "linear-gradient(0deg,rgba(11,15,19,.95) 0%,rgba(11,15,19,.55) 50%,rgba(11,15,19,.2) 100%)",
    primary: { label: "Demander une démo", action: "demo" },
    secondary: { label: "Démarrer gratuitement", action: "start" },
  },
];

// Placement de la section dans l'écran, selon sa composition
const PLACEMENT = {
  "bas-gauche": "justify-end",
  "haut-droite": "justify-end md:justify-start md:items-end md:text-right md:pt-[22vh]",
  eclate: "justify-end md:justify-between md:pt-[17vh]",
  "plein-cadre": "justify-end",
};

const TITLE = {
  "bas-gauche": "max-w-[11ch] text-[clamp(3rem,8vw,8.5rem)]",
  "haut-droite": "max-w-[12ch] text-[clamp(2.75rem,6.8vw,7rem)]",
  eclate: "max-w-[10ch] text-[clamp(3rem,8.5vw,9rem)]",
  "plein-cadre": "max-w-[16ch] text-[clamp(3rem,9.5vw,10.5rem)] leading-[0.88]",
};

const pad = (n) => String(n).padStart(2, "0");

const btnPrimary =
  "lk-focus group inline-flex items-center justify-center gap-2 whitespace-nowrap h-12 px-6 rounded-full bg-orange-vif text-nuit text-base font-bold transition-colors hover:bg-[#FF8A47]";
const btnSecondary =
  "lk-focus inline-flex items-center justify-center whitespace-nowrap h-12 px-6 rounded-full border border-white/25 bg-nuit/40 backdrop-blur-md text-craie text-base font-semibold transition-colors hover:bg-white/[0.14]";

export default function LandingHero({ onGetStarted }) {
  const rootRef = useRef(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  // Chaque section occupe 100vh de défilement ; la scène reste collée à l'écran
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = rootRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const travel = Math.max(height - window.innerHeight, 1);
      const p = Math.min(Math.max(-top / travel, 0), 1);
      setProgress(p);
      setActive(Math.round(p * (SLIDES.length - 1)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Au clavier, focaliser un bouton d'une section masquée fait défiler jusqu'à elle
  const goTo = (index) => {
    const el = rootRef.current;
    if (!el || index === active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY + index * window.innerHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const run = (action) => {
    if (action === "start") onGetStarted?.();
    else if (action === "demo") window.location.href = "/demo";
    else if (action === "features")
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    else if (action === "how")
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={rootRef}
      className="relative bg-nuit -mt-[76px]"
      style={{ height: `${SLIDES.length * 100}svh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Photos : fondu enchaîné et zoom lent */}
        {SLIDES.map((s, i) => (
          <img
            key={s.id}
            src={s.image}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority={i === 0 ? "high" : "low"}
            className={`lh-media ${i === active ? "is-active" : ""}`}
            style={{ objectPosition: s.position }}
          />
        ))}

        {/* Voile orienté selon la composition de la section */}
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            aria-hidden="true"
            className={`lh-veil ${i === active ? "is-active" : ""}`}
            style={{ background: s.veil }}
          />
        ))}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-[2] h-40 bg-[linear-gradient(180deg,rgba(11,15,19,.7),transparent)]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-[linear-gradient(0deg,#0B0F13,transparent)]" />

        {/* Textes des 4 sections, chacune avec son placement */}
        {SLIDES.map((s, i) => {
          const Heading = i === 0 ? "h1" : "h2";
          const right = s.layout === "haut-droite";

          const eyebrow = (
            <p className="font-data text-[13px] sm:text-sm font-medium uppercase tracking-[0.16em] text-craie">
              <span>{pad(i + 1)}</span>
              <span className="mx-1.5 text-craie-2">/</span>
              <span className="text-craie-2">{pad(SLIDES.length)}</span>
              <span className="mx-2 text-craie-2">—</span>
              {s.label}
            </p>
          );
          const title = (
            <Heading
              id={`hero-${s.id}`}
              className={`mt-5 font-ui font-bold text-craie leading-[0.92] tracking-[-0.04em] ${TITLE[s.layout]} ${right ? "md:ml-auto" : ""}`}
            >
              {s.title}
            </Heading>
          );
          const text = (
            <p className={`max-w-xl text-lg sm:text-[1.375rem] font-medium leading-snug text-craie ${right ? "md:ml-auto" : ""}`}>
              {s.text}
            </p>
          );
          const buttons = (
            <div className={`flex flex-wrap items-center gap-3 ${right ? "md:justify-end" : ""}`}>
              <button type="button" onClick={() => run(s.primary.action)} className={btnPrimary}>
                {s.primary.label}
                <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </button>
              <button type="button" onClick={() => run(s.secondary.action)} className={btnSecondary}>
                {s.secondary.label}
              </button>
            </div>
          );

          return (
            <section
              key={s.id}
              aria-labelledby={`hero-${s.id}`}
              onFocus={() => goTo(i)}
              className={`lh-copy absolute inset-0 z-[3] flex flex-col pl-5 sm:pl-10 lg:pl-16 pr-14 sm:pr-24 pt-28 pb-[clamp(3.5rem,11vh,7.5rem)] ${PLACEMENT[s.layout]} ${i === active ? "is-active" : ""}`}
            >
              {s.layout === "eclate" ? (
                <>
                  {/* Titre en haut à gauche, texte et boutons en bas à droite */}
                  <div>
                    {eyebrow}
                    {title}
                  </div>
                  <div className="mt-8 md:mt-0 md:self-end md:max-w-md space-y-7">
                    {text}
                    {buttons}
                  </div>
                </>
              ) : s.layout === "plein-cadre" ? (
                <>
                  {/* Titre géant sur toute la largeur, texte à gauche et boutons à droite */}
                  {eyebrow}
                  {title}
                  <div className="mt-8 md:mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-7">
                    {text}
                    {buttons}
                  </div>
                </>
              ) : (
                <>
                  {eyebrow}
                  {title}
                  <div className="mt-7 space-y-8">
                    {text}
                    {buttons}
                  </div>
                </>
              )}
            </section>
          );
        })}

        {/* Barre de progression verticale */}
        <div
          aria-hidden="true"
          className="absolute z-[4] right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 font-data text-[12px] font-medium text-craie-2"
        >
          <span>{pad(1)}</span>
          <div className="relative w-0.5 h-[clamp(8rem,28vh,14rem)] bg-white/15">
            <div
              className="absolute inset-x-0 top-0 bg-craie"
              style={{ height: `${progress * 100}%` }}
            />
          </div>
          <span>{pad(SLIDES.length)}</span>
        </div>
      </div>
    </div>
  );
}
