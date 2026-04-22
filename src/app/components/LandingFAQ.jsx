'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import MessageModal from './MessageModal';

const FAQS = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous avez 7 jours pour tester SGTEC. Carte bancaire requise à l'inscription, mais vous ne serez débité qu'après la période d'essai.",
  },
  {
    q: "L'application fonctionne-t-elle hors connexion ?",
    a: "Une version hors-ligne est en cours de développement. Actuellement, une connexion internet est nécessaire.",
  },
  {
    q: "Comment inviter mon équipe ?",
    a: "Depuis votre tableau de bord, envoyez des invitations par email. Vos collaborateurs créent leur compte et rejoignent votre espace entreprise automatiquement.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Chiffrement des mots de passe, sessions sécurisées JWT, et isolation complète des données entre entreprises.",
  },
  {
    q: "Puis-je exporter mes rapports ?",
    a: "Oui, tous les rapports sont exportables en PDF professionnel avec votre logo et une mise en page personnalisable.",
  },
  {
    q: "Comment fonctionne le pointage ?",
    a: "Le chef de chantier pointe les ouvriers chaque jour depuis l'application. Les heures et présences sont calculées automatiquement.",
  },
];

function useInView(threshold = 0.15) {
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

export default function LandingFAQ() {
  const { data: session, status } = useSession();
  const [openIndex, setOpenIndex] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [headerRef, headerVisible] = useInView(0.2);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  const handleContact = (e) => {
    e.preventDefault();
    if (status === 'authenticated') {
      setShowMessageModal(true);
    } else {
      window.location.href = '/?login=true';
    }
  };

  return (
    <section id="faq" className="py-24" style={{ background: '#F8FAFC' }}>
      <style>{`
        .faq-body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows .35s ease;
        }
        .faq-body.open { grid-template-rows: 1fr; }
        .faq-inner { overflow: hidden; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-14"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity .7s ease, transform .7s ease',
          }}
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F59E0B' }}>FAQ</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Questions fréquentes
          </h2>
          <div className="mt-4 mx-auto w-16 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />
          <p className="mt-6 text-lg text-gray-500">
            Tout ce que vous devez savoir avant de vous lancer.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <div
              key={i}
              className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                openIndex === i ? 'border-yellow-300 bg-white shadow-lg' : 'border-gray-200 bg-white hover:border-yellow-200 hover:shadow-sm'
              }`}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
              >
                <span className={`font-semibold text-sm leading-snug ${openIndex === i ? 'text-gray-900' : 'text-gray-800'}`}>
                  {item.q}
                </span>
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: openIndex === i ? '#F59E0B' : '#f1f5f9',
                  }}
                >
                  {openIndex === i
                    ? <Minus className="w-3.5 h-3.5 text-white" />
                    : <Plus className="w-3.5 h-3.5 text-gray-500" />}
                </div>
              </button>

              <div className={`faq-body ${openIndex === i ? 'open' : ''}`}>
                <div className="faq-inner">
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center rounded-3xl p-8 border"
          style={{ background: 'white', borderColor: '#e2e8f0' }}>
          <p className="text-base font-bold text-gray-900 mb-1">Vous avez une autre question ?</p>
          <p className="text-sm text-gray-400 mb-5">Notre équipe vous répond en moins de 24 h.</p>
          <button
            onClick={handleContact}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ background: '#F59E0B', color: '#0F172A' }}
          >
            Envoyez-nous un message
          </button>
        </div>
      </div>

      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
    </section>
  );
}
