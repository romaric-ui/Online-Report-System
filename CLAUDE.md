# CLAUDE.md

Application Next.js 15 (App Router) + Tailwind 3 de gestion de chantier BTP, utilisée par des conducteurs de travaux sur ordinateur et tablette.

## Système de design

Direction : sobre, professionnel, dense mais lisible. Palette BTP : gris ardoise + orange sécurité.

### Où vivent les tokens
- `src/app/globals.css` : variables CSS (palette, polices, espacements, rôles `--sb-*` de la sidebar avec leur version sombre sous `[data-theme="dark"]`).
- `tailwind.config.js` : les mêmes tokens exposés en classes Tailwind.
- `src/app/layout.tsx` : chargement des polices via `next/font/google` (variables `--font-barlow`, `--font-barlow-condensed`, `--font-plex-mono`).
- Le mode sombre est piloté par `data-theme="dark"` sur `<html>` (voir `ThemeToggle.jsx`), pas par `prefers-color-scheme`.

### Palette
| Token Tailwind | Valeur | Usage |
|---|---|---|
| `ardoise-900` | `#1C2329` | Texte principal sur fond clair, boutons secondaires |
| `ardoise-500` | `#5C6873` | Texte secondaire sur fond clair |
| `ardoise-100` / `ardoise-50` | `#E3E7EA` / `#F4F6F7` | Bordures, fond de la sidebar |
| `securite` | `#EF5B0C` | Accent orange sécurité sur fond clair |
| `orange-vif` | `#FF7426` | Accent sur fond sombre, boutons principaux |
| `nuit` / `nuit-2` / `nuit-3` | `#0B0F13` / `#12181E` / `#1A2128` | Fonds sombres (landing, cartes sombres) |
| `craie` / `craie-2` / `craie-3` | `#ECEFF1` / `#A7B0B8` / `#76818B` | Texte sur fond sombre (principal / secondaire / discret) |
| `beton` / `beton-2` | `#E6E9EB` / `#F2F4F5` | Sections claires de la landing |
| `sb-*` | variables CSS | Rôles de la sidebar, basculent clair/sombre automatiquement |

Les couleurs de marque sont en hex dans la config Tailwind (et non en `var()`) pour que les modificateurs d'opacité fonctionnent (`bg-nuit/90`, `bg-securite/10`). Seuls les rôles `sb-*` passent par des variables, car ils changent avec le thème.

### Polices
- **Barlow** (`font-ui`, police par défaut du `body`) : texte courant et titres. Titres en 600, interlignage serré (`leading-[0.95]` à `[1.08]`), approche négative (`tracking-[-0.02em]` à `[-0.035em]`).
- **Barlow Condensed** (`font-display`) : réservée au logotype « SGTEC » et aux titres de groupes de la sidebar, en majuscules espacées.
- **IBM Plex Mono** (`font-data`) : surtitres et métadonnées (repères « 02 / 06 », emails, petites étiquettes en majuscules).
- Tailles : les échelles `text-xs` et `text-sm` ont été remontées à 13 px et 15 px pour la lisibilité. Ne pas descendre sous 12 px. Sidebar : `text-ui-xs` 12, `text-ui-sm` 14, `text-ui-base` 15.

### Espacements et formes
- Grille de 4 px. Lignes de menu de 40 px (`h-sb-item`), assez hautes pour le tactile sur tablette.
- Sidebar : rayon 4 px (`rounded-sb`), largeur 250 px (`w-sb`, liée à `md:ml-[250px]` dans `AppLayout.jsx`).
- Landing : boutons et puces en pilule (`rounded-full`), cartes en `rounded-2xl` / `rounded-3xl`.

### Règles
- **À éviter :** dégradés violets, ombres partout (séparer avec des bordures fines), polices par défaut (Arial, Inter), couleurs arc-en-ciel par élément.
- Un seul élément signature par écran :
  - Sidebar : la bande « balisage de chantier » (classe `.sb-hazard`) qui marque la page active. L'orange n'apparaît que sur l'élément actif.
  - Landing : la vidéo plein cadre et les repères de chapitre « 0X / 06 » (composants `Eyebrow` / `SectionHeading` de `LandingKit.jsx`). Si on ajoute ou retire une section, mettre à jour `CHAPTERS`.
- Texte sur un bouton orange : toujours sombre (`text-nuit` / `sb-on-accent`), comme la signalétique de chantier. Jamais de blanc sur orange (contraste insuffisant).
- Séparer avec des bordures fines (`border-white/[0.09]` sur fond sombre, `border-ardoise-900/10` sur fond clair) plutôt qu'avec des ombres. La trame `gap-px` sur un fond de bordure sert aux grilles.
- Accessibilité :
  - Focus clavier visible (`.lk-focus` sur la landing, `focus-visible:outline-sb-accent` dans la sidebar).
  - Animations coupées avec `prefers-reduced-motion`.
  - `aria-current`, `aria-expanded` et `aria-label` sur la navigation et les menus.
- Animations : uniquement la montée du hero au chargement (`.lk-rise`) et l'apparition au scroll (`Reveal`, `.lk-reveal`). Pas d'orbes, de particules ou d'effets qui suivent la souris.
- Rédaction : français, phrases à la casse normale, verbes d'action sur les boutons (« Démarrer gratuitement », « Envoyez-nous un message »). Espace insécable avant « ? », « ! », « : ».

### Points ouverts
- La marque n'est pas tranchée : logo PROJECTRA (`public/logo_projectra.png`, fond blanc, affiché dans une pastille blanche) contre SGTEC dans le reste du site.
- `public/videos/chantier.mp4` porte un filigrane iStock : la remplacer ou acheter la licence avant la mise en ligne.
