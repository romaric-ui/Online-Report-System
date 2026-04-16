"use client";
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import MessageModal from './MessageModal';

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous avez 14 jours pour tester toutes les fonctionnalités du plan Pro. Aucune carte bancaire requise.",
  },
  {
    q: "L'application fonctionne-t-elle hors connexion ?",
    a: "Une version hors-ligne est en cours de développement. Actuellement, une connexion internet est nécessaire.",
  },
  {
    q: "Comment inviter mon équipe ?",
    a: "Depuis votre dashboard, envoyez une invitation par email ou partagez un lien. Vos collaborateurs créent leur compte et rejoignent votre entreprise.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Chiffrement des mots de passe, sessions sécurisées, et isolation complète des données entre entreprises.",
  },
  {
    q: "Puis-je exporter mes rapports ?",
    a: "Oui, tous les rapports sont exportables en PDF professionnel avec votre logo et mise en page personnalisée.",
  },
  {
    q: "Comment fonctionne le pointage ?",
    a: "Le chef de chantier pointe les ouvriers chaque jour depuis l'application. Les heures sont calculées automatiquement.",
  },
];

export default function LandingFAQ() {
  const { data: session, status } = useSession();
  const [openIndex, setOpenIndex] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const toggle = (index) => setOpenIndex(openIndex === index ? null : index);

  const handleContact = (e) => {
    e.preventDefault();
    if (status === 'authenticated') {
      setShowMessageModal(true);
    } else {
      window.location.href = '/?login=true';
    }
  };

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <style>{`
        .faq-body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows .3s ease;
        }
        .faq-body.open {
          grid-template-rows: 1fr;
        }
        .faq-inner {
          overflow: hidden;
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">FAQ</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Questions <span className="text-indigo-600">fréquentes</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500">
            Tout ce que vous devez savoir avant de vous lancer.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((item, index) => (
            <div
              key={index}
              className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                openIndex === index
                  ? 'border-indigo-200 bg-white shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-100 hover:shadow-sm'
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
              >
                <span className={`font-semibold text-sm leading-snug ${
                  openIndex === index ? 'text-indigo-700' : 'text-gray-800'
                }`}>
                  {item.q}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                  openIndex === index ? 'bg-indigo-600' : 'bg-gray-100'
                }`}>
                  {openIndex === index
                    ? <Minus className="w-3.5 h-3.5 text-white" />
                    : <Plus className="w-3.5 h-3.5 text-gray-500" />
                  }
                </div>
              </button>

              <div className={`faq-body ${openIndex === index ? 'open' : ''}`}>
                <div className="faq-inner">
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <p className="text-base font-bold text-gray-900 mb-1">Vous avez une autre question ?</p>
          <p className="text-sm text-gray-400 mb-5">Notre équipe vous répond en moins de 24 h.</p>
          <button
            onClick={handleContact}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Envoyez-nous un message
          </button>
        </div>
      </div>

      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
    </section>
  );
}
