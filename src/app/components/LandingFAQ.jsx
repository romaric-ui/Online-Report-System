"use client";
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      category: "Général",
      questions: [
        {
          q: "Qu'est-ce que Online Report System ?",
          a: "Online Report System est une plateforme cloud de gestion de rapports de chantier. Elle digitalise vos processus de suivi, génère des rapports PDF professionnels et centralise toutes vos données de construction."
        },
        {
          q: "Pour qui est destinée cette solution ?",
          a: "Notre plateforme s'adresse aux entreprises du BTP, chefs de chantier, conducteurs de travaux, architectes et bureaux d'études qui souhaitent moderniser leur gestion documentaire."
        }
      ]
    },
    {
      category: "Fonctionnalités",
      questions: [
        {
          q: "Comment créer un rapport ?",
          a: "Connectez-vous, cliquez sur 'Nouveau rapport', renseignez les informations du chantier (entreprise, phase, équipe, matériel), puis générez le PDF en un clic. Le tout en moins de 2 minutes."
        },
        {
          q: "Puis-je personnaliser mes rapports ?",
          a: "Oui, vous pouvez ajouter votre logo, personnaliser les couleurs, ajouter des photos de couverture et adapter les champs selon vos besoins spécifiques."
        },
        {
          q: "Les rapports sont-ils modifiables ?",
          a: "Absolument. Vous pouvez modifier vos rapports à tout moment, régénérer les PDFs et conserver un historique complet des versions."
        }
      ]
    },
    {
      category: "Sécurité & Données",
      questions: [
        {
          q: "Mes données sont-elles sécurisées ?",
          a: "Oui. Nous utilisons un chiffrement SSL/TLS, des mots de passe hashés (bcrypt), et notre infrastructure est hébergée sur des serveurs certifiés avec sauvegardes quotidiennes automatiques."
        },
        
      ]
    },
    {
      category: "Tarifs & Support",
      questions: [
        {
          q: "Quels sont les tarifs ?",
          a: "Nous proposons un essai gratuit, puis des formules à partir de 19€/mois. Contactez-nous pour une offre sur mesure adaptée à la taille de votre entreprise."
        },
        {
          q: "Comment obtenir de l'aide ?",
          a: "Notre équipe support est disponible par email (sgtec-gc@groupe-imo.com) ou téléphone (+33 6 19 99 67 34). Réponse garantie sous 24h ouvrées."
        }
      ]
    }
  ];

  // Aplatir toutes les questions pour l'index global
  const allQuestions = faqs.flatMap((cat, catIndex) => 
    cat.questions.map((q, qIndex) => ({ ...q, catIndex, qIndex, category: cat.category }))
  );

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 text-blue-700 rounded-full text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
            Questions Fréquentes
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Tout ce que vous devez savoir sur notre plateforme de gestion de rapports
          </p>
        </div>

        {/* FAQ Grid - 2 colonnes sur desktop */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {allQuestions.map((item, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 ${
                openIndex === index 
                  ? 'border-blue-500 shadow-xl shadow-blue-100/50' 
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              {/* Category badge */}
              {(index === 0 || allQuestions[index - 1].category !== item.category) && (
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold rounded-full shadow-lg">
                    {item.category}
                  </span>
                </div>
              )}

              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-start gap-4 transition-colors duration-200"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  openIndex === index 
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg' 
                    : 'bg-slate-100 group-hover:bg-blue-50'
                }`}>
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-white" strokeWidth={3} />
                  ) : (
                    <Plus className="w-5 h-5 text-slate-600 group-hover:text-blue-600" strokeWidth={3} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 transition-colors duration-200 ${
                    openIndex === index ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'
                  }`}>
                    {item.q}
                  </h3>
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-6 pb-6 pl-[4.5rem]">
                  <p className="text-slate-600 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bottom */}
        <div className="mt-20 text-center">
          <div className="inline-block p-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl shadow-2xl">
            <p className="text-white text-lg mb-6 font-medium">
              Vous ne trouvez pas la réponse à votre question ?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:sgtec-gc@groupe-imo.com"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Envoyez-nous un email
              </a>
              <a
                href="tel:+33619996734"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Appelez-nous
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
