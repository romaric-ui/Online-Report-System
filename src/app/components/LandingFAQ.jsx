'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import MessageModal from './MessageModal';
import { SectionHeading } from './LandingKit';

const FAQS = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous avez 7 jours pour tester PROJECTRA. Une carte bancaire est demandée à l'inscription, mais vous n'êtes débité qu'à la fin de la période d'essai.",
  },
  {
    q: "L'application fonctionne-t-elle hors connexion ?",
    a: "Une version hors ligne est en cours de développement. Pour l'instant, une connexion internet est nécessaire.",
  },
  {
    q: "Comment inviter mon équipe ?",
    a: "Depuis votre tableau de bord, envoyez des invitations par email. Vos collaborateurs créent leur compte et rejoignent automatiquement votre espace entreprise.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Les mots de passe sont chiffrés, les sessions sont sécurisées et les données de chaque entreprise sont complètement isolées.",
  },
  {
    q: "Puis-je exporter mes rapports ?",
    a: "Oui, tous les rapports s'exportent en PDF, avec votre logo et une mise en page personnalisable.",
  },
  {
    q: "Comment fonctionne le pointage ?",
    a: "Le chef de chantier pointe les ouvriers chaque jour depuis l'application. Les heures et les présences sont calculées automatiquement.",
  },
];

export default function LandingFAQ() {
  const { status } = useSession();
  const [openIndex, setOpenIndex] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

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
    <section id="faq" className="bg-beton py-28 md:py-36 scroll-mt-20">
      <style>{`
        .faq-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .35s ease; }
        .faq-body.open { grid-template-rows: 1fr; }
        .faq-inner { overflow: hidden; }
        @media (prefers-reduced-motion: reduce) { .faq-body { transition: none; } }
      `}</style>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-14 lg:gap-20">
        <div className="lg:sticky lg:top-28 self-start">
          <SectionHeading
            tone="light"
            index={6}
            label="Questions fréquentes"
            title="Avant de vous lancer."
          />
          <div className="mt-10 rounded-3xl bg-white border border-ardoise-900/10 p-8">
            <p className="text-lg font-semibold text-ardoise-900">Une autre question ?</p>
            <p className="mt-1 text-base text-ardoise-500">Notre équipe vous répond en moins de 24 h.</p>
            <button
              type="button"
              onClick={handleContact}
              className="lk-focus mt-6 inline-flex items-center h-12 px-6 rounded-full bg-ardoise-900 text-white text-[15px] font-semibold hover:bg-ardoise-700 transition-colors"
            >
              Envoyez-nous un message
            </button>
          </div>
        </div>

        {/* Accordéon */}
        <ul className="border-t border-ardoise-900/15">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <li key={item.q} className="border-b border-ardoise-900/15">
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    className="lk-focus w-full py-7 text-left flex items-center justify-between gap-6 group"
                  >
                    <span className="text-lg sm:text-xl font-semibold leading-snug text-ardoise-900">
                      {item.q.replace(/ \?$/, ' ?')}
                    </span>
                    <span
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                        open ? 'bg-ardoise-900 border-ardoise-900 text-white' : 'border-ardoise-900/15 text-ardoise-700 group-hover:border-ardoise-900/40'
                      }`}
                    >
                      <Plus className={`w-4 h-4 transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-45' : ''}`} />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-button-${i}`}
                  className={`faq-body ${open ? 'open' : ''}`}
                >
                  <div className="faq-inner">
                    <p className="pb-7 pr-16 text-base leading-relaxed text-ardoise-500">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
    </section>
  );
}
