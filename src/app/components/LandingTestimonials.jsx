"use client";
import { Star, Quote } from 'lucide-react';

export default function LandingTestimonials() {
  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Chef de chantier",
      company: "BTP Solutions",
      image: "https://ui-avatars.com/api/?name=Marie+Dubois&background=3b82f6&color=fff&size=80",
      content: "Cette plateforme a révolutionné notre façon de gérer les rapports de chantier. Fini les papiers qui se perdent !",
      rating: 5
    },
    {
      name: "Thomas Martin",
      role: "Directeur de projet",
      company: "ConstructPro",
      image: "https://ui-avatars.com/api/?name=Thomas+Martin&background=8b5cf6&color=fff&size=80",
      content: "Un gain de temps incroyable. Nous avons réduit de 60% le temps passé sur la documentation administrative.",
      rating: 5
    },
    {
      name: "Sophie Bernard",
      role: "Architecte",
      company: "Design & Build",
      image: "https://ui-avatars.com/api/?name=Sophie+Bernard&background=ec4899&color=fff&size=80",
      content: "Interface intuitive et fonctionnalités complètes. Exactement ce dont nous avions besoin pour nos projets.",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-4">
            <Star className="w-4 h-4 mr-2 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600">Témoignages</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez ce que nos clients disent de notre plateforme
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-fade-in-up border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-6">
                <Quote className="w-6 h-6 text-white" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
