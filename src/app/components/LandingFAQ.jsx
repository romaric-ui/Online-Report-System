"use client";
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import MessageModal from './MessageModal';

export default function LandingFAQ() {
  const { data: session, status } = useSession();
  const [openIndex, setOpenIndex] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const faqs = [
    {
      category: "Général",
      questions: [
        {
          q: "Qu'est-ce que SGTEC ?",
          a: "SGTEC est une application web de gestion de rapports de chantier. Elle vous permet de créer des comptes-rendus structurés en ligne et de générer des PDF professionnels prêts à envoyer au client ou au maître d'ouvrage.",
        },
        {
          q: "À qui s'adresse cette application ?",
          a: "Aux entreprises du BTP, chefs de chantier, conducteurs de travaux et bureaux d'études qui veulent remplacer les rapports papier ou Excel par un outil web simple et structuré.",
        },
      ],
    },
    {
      category: "Utilisation",
      questions: [
        {
          q: "Comment créer un rapport ?",
          a: "Connectez-vous, cliquez sur « Nouveau rapport », remplissez les champs (client, localisation, phase, équipe, matériel, avancement, incidents) puis cliquez sur « Générer PDF ». Le document est prêt en quelques secondes.",
        },
        {
          q: "Quelles informations contient un rapport ?",
          a: "Chaque rapport inclut : les informations du chantier (client, localisation, date, phase), l'équipe et le matériel présents, l'avancement des travaux, les incidents ou non-conformités, les observations, et éventuellement des photos.",
        },
        {
          q: "Puis-je modifier un rapport après l'avoir créé ?",
          a: "Oui, vos rapports restent modifiables depuis votre tableau de bord. Vous pouvez mettre à jour les informations et regénérer le PDF à tout moment.",
        },
      ],
    },
    {
      category: "Compte & Sécurité",
      questions: [
        {
          q: "Comment créer un compte ?",
          a: "Vous pouvez vous inscrire avec votre email (un code de vérification vous sera envoyé) ou vous connecter directement avec votre compte Google.",
        },
        {
          q: "Mes données sont-elles sécurisées ?",
          a: "Oui. Les mots de passe sont hashés avec bcrypt, les sessions utilisent des tokens JWT, et toutes les entrées sont validées côté serveur pour prévenir les injections SQL et les attaques XSS. Chaque utilisateur n'a accès qu'à ses propres rapports.",
        },
      ],
    },
    {
      category: "Support",
      questions: [
        {
          q: "L'application est-elle gratuite ?",
          a: "Oui, l'inscription et l'utilisation sont actuellement gratuites. Des formules payantes avec des fonctionnalités avancées pourront être proposées à l'avenir.",
        },
        {
          q: "Comment contacter le support ?",
          a: "Vous pouvez nous envoyer un message directement depuis l'application (une fois connecté) ou nous écrire à sgtec-gc@groupe-imo.com.",
        },
      ],
    },
  ];

  const allQuestions = faqs.flatMap((cat) =>
    cat.questions.map((q) => ({ ...q, category: cat.category }))
  );

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleEmailClick = (e) => {
    e.preventDefault();
    if (status === 'authenticated') {
      setShowMessageModal(true);
    } else {
      alert("Veuillez vous connecter pour envoyer un message à l'administrateur.");
      window.location.href = '/?login=true';
    }
  };

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">FAQ</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Questions fréquentes
          </h2>
          <p className="mt-4 text-gray-500">
            Les réponses aux questions les plus courantes sur l'application.
          </p>
        </div>

        <div className="space-y-2">
          {allQuestions.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                openIndex === index
                  ? 'border-blue-200 bg-white shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
              >
                <span className={`font-semibold text-sm leading-snug ${
                  openIndex === index ? 'text-blue-700' : 'text-gray-800'
                }`}>
                  {item.q}
                </span>
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  openIndex === index ? 'bg-blue-600' : 'bg-gray-100'
                }`}>
                  {openIndex === index
                    ? <Minus className="w-3.5 h-3.5 text-white" />
                    : <Plus className="w-3.5 h-3.5 text-gray-500" />
                  }
                </div>
              </button>

              <div className={`transition-all duration-300 overflow-hidden ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}>
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-semibold text-gray-900 mb-1">Vous avez une autre question ?</p>
          <p className="text-sm text-gray-400 mb-5">Notre équipe vous répond rapidement.</p>
          <button
            onClick={handleEmailClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
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
