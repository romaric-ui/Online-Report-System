'use client';
import { Reveal, SectionHeading } from './LandingKit';

// Photos provisoires (captures déposées dans public/images)
const photo = (time) => encodeURI(`/images/Capture d'écran 2026-10-24 ${time}.png`);

// Ordre et tailles calés pour remplir la grille sans trou (4 colonnes, 2 sur mobile)
const TILES = [
  { time: '162745', span: 'row-span-2', alt: 'Plans d’étage et rendu de façade d’une maison à étage' },
  { time: '164810', span: 'col-span-2 row-span-2', alt: 'Bâtiment à bardage noir aux fenêtres éclairées, au crépuscule' },
  { time: '164707', span: 'row-span-2', alt: 'Maison noire aux volumes cubiques et escalier extérieur' },
  { time: '165307', span: 'col-span-2', alt: 'Villa noire à toit-terrasse, garde-corps vitrés et palmiers' },
  { time: '170221', span: 'row-span-2', alt: 'Façade en béton brut avec claustras noirs' },
  { time: '164730', span: 'row-span-2', alt: 'Maison noire en porte-à-faux, entrée éclairée' },
  { time: '163237', span: '', alt: 'Maison à étage en bardage gris ardoise' },
  // Cadrée en haut : le filigrane en bas de l'image est rogné
  { time: '164750', span: '', alt: 'Maison noire sur pelouse', position: 'center top' },
  { time: '164521', span: 'col-span-2', alt: 'Maison de plain-pied blanche avec garage' },
  // Cadrage carré : les bandes noires de la capture sont rognées
  { time: '164833', span: '', alt: 'Villa noire éclairée au crépuscule' },
  { time: '170234', span: '', alt: 'Maison à étage noire avec balcon vitré' },
];

export default function LandingGallery() {
  return (
    <section id="livraison" className="relative bg-nuit py-28 md:py-36 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeading
          index={1}
          label="Livraison"
          title="Du chantier à la remise des clés."
          intro="Plans, rapports, réserves et budget : chaque étape est suivie jusqu'à la livraison."
        />

        <Reveal className="mt-16">
          <ul className="grid grid-cols-2 md:grid-cols-4 grid-flow-dense auto-rows-[clamp(11rem,20vw,16rem)] gap-px rounded-3xl overflow-hidden border border-white/[0.09] bg-white/[0.09]">
            {TILES.map(({ time, span, alt, position }) => (
              <li key={time} className={`relative bg-nuit-2 ${span}`}>
                <img
                  src={photo(time)}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={position ? { objectPosition: position } : undefined}
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
