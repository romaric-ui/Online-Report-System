"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

// Photos de chantier provisoires (captures déposées dans public/images)
const photo = (time) => encodeURI(`/images/Capture d'écran 2026-10-24 ${time}.png`);

const SLIDES = [
  {
    id: "suivi",
    label: "Suivi de chantier",
    title: "Chaque chantier, en temps réel.",
    text: "Avancement, équipes et incidents remontent du terrain au bureau, sans attendre la réunion de chantier.",
    image: photo("165426"),
    position: "center",
    primary: { label: "Démarrer gratuitement", action: "start" },
    secondary: { label: "Voir la démo en direct", action: "demo" },
  },
  {
    id: "rapports",
    label: "Rapports journaliers",
    title: "Le rapport du jour, bouclé sur place.",
    text: "Météo, effectifs, travaux réalisés et photos : le rapport se remplit sur tablette et part en PDF le soir même.",
    image: photo("162949"),
    position: "center 70%",
    primary: { label: "Démarrer gratuitement", action: "start" },
    secondary: { label: "Voir les fonctionnalités", action: "features" },
  },
  {
    id: "budget",
    label: "Budget et planning",
    title: "Budget et planning, sous contrôle.",
    text: "Dépenses et jalons comparés au prévisionnel, pour repérer les dérives avant qu'elles ne coûtent.",
    image: photo("165408"),
    position: "center",
    primary: { label: "Démarrer gratuitement", action: "start" },
    secondary: { label: "Comment ça marche", action: "how" },
  },
  {
    id: "demo",
    label: "Démonstration",
    title: "Voyez-le sur un vrai chantier.",
    text: "Parcourez un chantier complet, de ses rapports à son budget, avant de vous lancer.",
    image: photo("163813"),
    position: "center 40%",
    primary: { label: "Demander une démo", action: "demo" },
    secondary: { label: "Démarrer gratuitement", action: "start" },
  },
];

const pad = (n) => String(n).padStart(2, "0");

const btnPrimary =
  "lk-focus group inline-flex items-center justify-center gap-2 whitespace-nowrap h-11 px-5 rounded-full bg-orange-vif text-nuit text-[15px] font-semibold transition-colors hover:bg-[#FF8A47]";
const btnSecondary =
  "lk-focus inline-flex items-center justify-center whitespace-nowrap h-11 px-5 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-md text-craie text-[15px] font-medium transition-colors hover:bg-white/[0.12]";

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

        {/* Voiles de lisibilité */}
        <div aria-hidden="true" className="absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgba(11,15,19,.9)_0%,rgba(11,15,19,.6)_40%,rgba(11,15,19,.1)_80%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 z-[2] h-40 bg-[linear-gradient(180deg,rgba(11,15,19,.7),transparent)]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[2] h-56 bg-[linear-gradient(0deg,#0B0F13,transparent)]" />

        {/* Textes des 4 sections, superposés */}
        <div className="relative z-[3] h-full w-full max-w-7xl mx-auto px-5 sm:px-8 flex items-end pb-[clamp(4rem,14vh,9rem)]">
          <div className="grid w-full">
            {SLIDES.map((s, i) => {
              const Heading = i === 0 ? "h1" : "h2";
              return (
                <section
                  key={s.id}
                  aria-labelledby={`hero-${s.id}`}
                  onFocus={() => goTo(i)}
                  className={`lh-copy [grid-area:1/1] max-w-4xl pr-10 ${i === active ? "is-active" : ""}`}
                >
                  <p className="font-data text-[13px] uppercase tracking-[0.14em] text-craie-2">
                    <span className="text-craie">{pad(i + 1)}</span>
                    <span className="mx-1.5 opacity-60">/</span>
                    {pad(SLIDES.length)}
                    <span className="mx-2 opacity-60">—</span>
                    {s.label}
                  </p>

                  <Heading
                    id={`hero-${s.id}`}
                    className="mt-5 font-ui font-bold text-craie text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.04em]"
                  >
                    {s.title}
                  </Heading>

                  <p className="mt-6 max-w-xl text-lg sm:text-xl leading-relaxed text-craie-2">
                    {s.text}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => run(s.primary.action)} className={btnPrimary}>
                      {s.primary.label}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </button>
                    <button type="button" onClick={() => run(s.secondary.action)} className={btnSecondary}>
                      {s.secondary.label}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* Barre de progression verticale */}
        <div
          aria-hidden="true"
          className="absolute z-[3] right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 font-data text-[12px] text-craie-3"
        >
          <span>{pad(1)}</span>
          <div className="relative w-px h-[clamp(8rem,28vh,14rem)] bg-white/15">
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
