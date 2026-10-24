'use client';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './LandingKit';

export default function LandingCTA({ onGetStarted, isAuthenticated }) {
  return (
    <section className="relative overflow-hidden bg-nuit">
      {/* Photo de fond assombrie : ses fentes de lumière ambrée font écho au bouton */}
      <img
        src={encodeURI("/images/Capture d'écran 2026-10-24 164739.png")}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[center_35%] opacity-40"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#0B0F13_0%,rgba(11,15,19,.7)_50%,#0B0F13_100%)]" />

      <Reveal className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-32 md:py-44">
        <h2 className="max-w-4xl font-semibold text-[clamp(2.5rem,6.4vw,5.75rem)] leading-[0.98] tracking-[-0.035em] text-craie">
          {isAuthenticated
            ? 'Prêt pour votre prochain chantier ?'
            : <>Digitalisez vos chantiers. <span className="text-craie-2">Dès aujourd&apos;hui.</span></>}
        </h2>

        <p className="mt-7 max-w-xl text-lg sm:text-xl leading-relaxed text-craie-2">
          {isAuthenticated
            ? 'Accédez à votre tableau de bord pour piloter vos projets en temps réel.'
            : 'Rejoignez les professionnels du BTP qui gagnent du temps chaque jour avec SGTEC.'}
        </p>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5">
          <button
            type="button"
            onClick={onGetStarted}
            className="lk-focus group inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-orange-vif text-nuit text-base font-semibold hover:bg-[#FF8A47] transition-colors"
          >
            {isAuthenticated ? 'Accéder à mes chantiers' : 'Créer mon compte gratuitement'}
            <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </button>
          <p className="text-base text-craie-2">7 jours d&apos;essai gratuit · Sans engagement</p>
        </div>
      </Reveal>
    </section>
  );
}
