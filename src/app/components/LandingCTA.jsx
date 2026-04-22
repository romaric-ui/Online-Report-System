'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export default function LandingCTA({ onGetStarted, isAuthenticated }) {
  const [ref, visible] = useInView(0.2);

  return (
    <section className="relative overflow-hidden py-28" style={{ background: '#0F172A' }}>
      <style>{`
        @keyframes ctaPulse {
          0%,100% { transform: scale(1); opacity: .4; }
          50%      { transform: scale(1.15); opacity: .7; }
        }
        @keyframes ctaFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .cta-orb1 { animation: ctaPulse 4s ease-in-out infinite; }
        .cta-orb2 { animation: ctaPulse 4s 2s ease-in-out infinite; }
        .cta-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(245,158,11,.25);
          animation: ctaFloat 3s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative orbs */}
      <div className="cta-orb1 absolute top-0 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,.2) 0%, transparent 70%)' }} />
      <div className="cta-orb2 absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%)' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(245,158,11,.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(245,158,11,.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

      {/* Particles */}
      {[
        { size:8,  top:'15%', left:'10%',  delay:'0s' },
        { size:5,  top:'70%', left:'15%',  delay:'.8s' },
        { size:10, top:'30%', right:'8%',  delay:'1.5s' },
        { size:6,  top:'80%', right:'20%', delay:'.4s' },
        { size:7,  top:'50%', left:'50%',  delay:'2s' },
      ].map((p, i) => (
        <div key={i} className="cta-particle"
          style={{ width:p.size, height:p.size, top:p.top, left:p.left, right:p.right, animationDelay:p.delay }} />
      ))}

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          ref={ref}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity .7s ease, transform .7s ease',
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
            style={{ background: 'rgba(245,158,11,.1)', borderColor: 'rgba(245,158,11,.3)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F59E0B', display:'inline-block' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F59E0B' }}>
              Rejoignez-nous
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            {isAuthenticated
              ? 'Prêt pour votre prochain chantier ?'
              : <>Digitalisez vos chantiers.<br /><span style={{ color: '#F59E0B' }}>Dès aujourd'hui.</span></>}
          </h2>

          <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
            {isAuthenticated
              ? "Accédez à votre tableau de bord pour piloter vos projets en temps réel."
              : "Rejoignez les professionnels du BTP qui gagnent du temps chaque jour avec SGTEC."}
          </p>

          <button
            onClick={onGetStarted}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-[1.04] shadow-xl"
            style={{ background: '#F59E0B', color: '#0F172A', boxShadow: '0 20px 40px -12px rgba(245,158,11,.4)' }}
          >
            {isAuthenticated ? 'Accéder à mes chantiers' : 'Créer mon compte gratuitement'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-5 text-sm" style={{ color: '#475569' }}>
            7 jours d'essai gratuit · Sans engagement
          </p>
        </div>
      </div>
    </section>
  );
}
