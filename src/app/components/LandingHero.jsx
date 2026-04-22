'use client';
import { ArrowRight, ChevronDown } from 'lucide-react';

const STATS = [
  { value: '500+', label: 'Chantiers gérés' },
  { value: '2 000+', label: 'Rapports générés' },
  { value: '98%', label: 'Satisfaction client' },
];

export default function LandingHero({ onGetStarted }) {

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroBadgePop {
          from { opacity: 0; transform: scale(.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes heroFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes heroGlow {
          0%,100% { opacity: .6; }
          50%      { opacity: 1; }
        }
        @keyframes heroPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.15); opacity: .7; }
        }
        .h-badge  { animation: heroBadgePop .6s ease both; }
        .h-title  { animation: heroFadeUp  .75s .1s ease both; }
        .h-sub    { animation: heroFadeUp  .75s .25s ease both; }
        .h-btns   { animation: heroFadeUp  .75s .4s ease both; }
        .h-stats  { animation: heroFadeUp  .75s .55s ease both; }
        .h-card   { animation: heroFadeUp  .9s .3s ease both; }
        .h-float  { animation: heroFloat 5s ease-in-out infinite; }
        .h-glow   { animation: heroGlow 3s ease-in-out infinite; }
        .h-pulse  { animation: heroPulse 2s ease-in-out infinite; }
      `}</style>

      {/* ── Video / dark overlay ── */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay muted loop playsInline
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        >
          <source src="/videos/chantier.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,.45) 0%, rgba(15,23,42,.35) 60%, rgba(30,41,59,.25) 100%)' }} />
        {/* Yellow glow orb */}
        <div className="h-glow absolute top-1/3 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,.18) 0%, transparent 70%)' }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            {/* Badge */}
            <div className="h-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6"
              style={{ background: 'rgba(245,158,11,.12)', borderColor: 'rgba(245,158,11,.35)' }}>
              <span className="h-pulse w-2 h-2 rounded-full" style={{ background: '#F59E0B', display:'inline-block', width:8, height:8 }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F59E0B' }}>
                Plateforme SaaS BTP
              </span>
            </div>

            {/* Title */}
            <h1 className="h-title text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight text-white mb-6">
              Pilotez vos<br />
              chantiers.{' '}
              <span style={{ color: '#F59E0B' }}>Sans</span><br />
              compromis.
            </h1>

            {/* Subtitle */}
            <p className="h-sub text-lg leading-relaxed mb-8 max-w-lg" style={{ color: '#94a3b8' }}>
              La plateforme tout-en-un pour les pros du BTP. Suivi en temps réel,
              gestion d'équipes, budget, planning et sécurité — depuis le terrain.
            </p>

            {/* Buttons */}
            <div className="h-btns flex flex-col sm:flex-row gap-3 mb-12">
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm transition-all duration-200 hover:scale-[1.03]"
                style={{ background: '#F59E0B', color: '#0F172A' }}
              >
                Démarrer gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,.15)' }}
              >
                Voir les fonctionnalités
              </button>
            </div>

            {/* Stats */}
            <div className="h-stats flex flex-wrap gap-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-black" style={{ color: '#F59E0B' }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="hidden lg:block h-card">
            <div className="h-float">
              <div className="relative">
                {/* Main card */}
                <div className="rounded-2xl overflow-hidden border shadow-2xl"
                  style={{ background: '#0F172A', borderColor: 'rgba(255,255,255,.1)' }}>
                  {/* Topbar */}
                  <div className="flex items-center justify-between px-5 py-3.5"
                    style={{ background: '#1E293B', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                    <div className="flex gap-1.5">
                      {['#ef4444','#f59e0b','#22c55e'].map((c,i) => (
                        <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:c }} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold" style={{ color:'#64748b' }}>SGTEC · Dashboard</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: '#F59E0B', color:'#0F172A' }}>R</div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* KPI row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Chantiers actifs', val: '12', color: '#3b82f6' },
                        { label: 'Avancement moy.', val: '74%', color: '#22c55e' },
                        { label: 'Alertes HSE', val: '3', color: '#ef4444' },
                      ].map((k,i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: '#1E293B' }}>
                          <div className="text-xs mb-1" style={{ color:'#64748b' }}>{k.label}</div>
                          <div className="text-2xl font-black" style={{ color:k.color }}>{k.val}</div>
                        </div>
                      ))}
                    </div>
                    {/* Progress bars */}
                    <div className="rounded-xl p-4" style={{ background:'#1E293B' }}>
                      <div className="text-xs font-semibold mb-3" style={{ color:'#64748b' }}>AVANCEMENT CHANTIERS</div>
                      <div className="space-y-2.5">
                        {[
                          { name:'Résidence Les Acacias', pct:82, color:'#22c55e' },
                          { name:'Immeuble Plateau',     pct:55, color:'#F59E0B' },
                          { name:'Villa Nord',           pct:30, color:'#3b82f6' },
                        ].map((c,i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1" style={{ color:'#94a3b8' }}>
                              <span>{c.name}</span><span className="font-bold">{c.pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background:'#334155' }}>
                              <div className="h-full rounded-full" style={{ width:`${c.pct}%`, background:c.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Team row */}
                    <div className="rounded-xl p-3 flex items-center justify-between" style={{ background:'#1E293B' }}>
                      <div>
                        <div className="text-xs mb-1" style={{ color:'#64748b' }}>ÉQUIPE PRÉSENTE</div>
                        <div className="flex -space-x-2">
                          {['#3b82f6','#22c55e','#F59E0B','#a855f7'].map((c,i) => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                              style={{ background:c, borderColor:'#1E293B' }}>
                              {['K','A','M','D'][i]}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color:'#64748b' }}>SÉCURITÉ HSE</div>
                        <div className="text-xl font-black" style={{ color:'#22c55e' }}>94%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge — rapport */}
                <div className="absolute -bottom-5 -left-8 rounded-2xl border px-4 py-3 flex items-center gap-3 shadow-xl"
                  style={{ background:'#1E293B', borderColor:'rgba(255,255,255,.1)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(34,197,94,.15)' }}>
                    <span style={{ color:'#22c55e', fontSize:16 }}>✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Rapport PDF généré</p>
                    <p className="text-xs" style={{ color:'#64748b' }}>il y a 3 minutes</p>
                  </div>
                </div>

                {/* Floating badge — alerte */}
                <div className="absolute -top-5 -right-6 rounded-2xl border px-4 py-3 flex items-center gap-3 shadow-xl"
                  style={{ background:'#1E293B', borderColor:'rgba(255,255,255,.1)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(245,158,11,.15)' }}>
                    <span style={{ color:'#F59E0B', fontSize:16 }}>⚡</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Alerte budget</p>
                    <p className="text-xs" style={{ color:'#64748b' }}>Chantier A — 90%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50">
        <ChevronDown className="w-5 h-5 text-white animate-bounce" />
      </div>
    </section>
  );
}
