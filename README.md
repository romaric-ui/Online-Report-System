# Online Report System (SGTEC)

Application Next.js permettant la saisie structurée d’un rapport chantier et la génération d’un PDF professionnel (page de garde, sections dynamiques, tableaux avec photos, pagination avancée).

## Sommaire
1. Fonctionnalités principales
2. Démarrage rapide
3. Saisie des données
4. Génération PDF (détails techniques)
5. Modèle de données (structure `report`)
6. Personnalisation / Extension
7. Limitations connues
8. Roadmap potentielle
9. Licence / Auteurs
10. Déploiement Netlify

---
## 1. Fonctionnalités principales
✔ Formulaire multi-sections (informations générales, déroulement, équipe, matériel, tableaux structurés).
✔ Deux tableaux distincts :
	 - Tableau d’investigation (investigationPoints)
	 - Autres points (autresPoints)
✔ Upload et redimensionnement automatique des photos (contrôle de dimension max, conversion base64).
✔ Génération PDF avec jsPDF + autotable :
	 - Page de garde (logo / badge phase / méta-infos)
	 - Sections dynamiques (texte justifié, titres stylés)
	 - Tableaux avec coloration AVIS (logique conforme / non conforme / neutre / observations, etc.)
	 - Images intégrées dans les cellules Photo / Cliché
	 - Pagination commençant à la page 2 (page de garde non numérotée)
✔ Filtrage : seules les lignes ayant un contenu sont incluses.
✔ Couleurs configurées dans le composant PDF.

## 2. Démarrage rapide
Installer les dépendances :
```bash
npm install
```
Lancer le serveur de dev :
```bash
npm run dev
```
Accéder à l’interface : http://localhost:3000

Générer un rapport :
1. Remplir le formulaire (ajouter des lignes dans “TABLEAU D'INVESTIGATION” et/ou “AUTRES POINTS”).
2. Ajouter si besoin un logo et un badge de phase (si l’interface le prévoit dans ta version locale).
3. Cliquer sur “Générer / Télécharger” (selon les boutons exposés dans `PdfGenerator.jsx`).

## 3. Saisie des données
Sections clés :
- Informations administratives (propriétaire, adresse, phase, numéro affaire / rapport, etc.)
- Déroulement de la visite (texte libre justifié dans le PDF)
- Équipe, Matériel (texte ou listes)
- Tableau d’investigation (investigationPoints)
- Autres points (autresPoints) — plus général / additionnel

Chaque ligne de tableau peut contenir :
- Chapitre (uppercase forcé)
- Moyen de contrôle (texte multi-ligne)
- Avis (liste déroulante normalisée)
- Commentaire
- Photo (PNG/JPEG redimensionnée)

## 4. Génération PDF (détails)
Localisation du code : `src/app/components/PdfGenerator.jsx`.
Principales étapes :
1. Initialisation doc A4 portrait.
2. Page de garde avec logo + titre + métadonnées.
3. Sous-titre “RAPPORT D'INVESTIGATION -PHASE X-”.
4. Insertion du tableau d’investigation (si données) avec phrase d’introduction.
5. Sections diverses (déroulement, équipe, matériel, autres points, conclusion...).
6. Coloration dynamique de la colonne Avis (fond + texte) selon la valeur.
7. Pagination appliquée en post-traitement : pages 2..N numérotées “1 / (N-1) …”.

Librairies :
- `jspdf`
- `jspdf-autotable`
- `html2canvas` (potentiellement utilisée pour snapshots ou logos complexes)

## 5. Modèle de données (exemple simplifié)
```ts
type InvestigationRow = {
	chapitre: string;
	moyen?: string; // ou moyenDeControle
	avis?: string;  // Conforme | Non conforme | ...
	commentaire?: string;
	photo?: string;       // dataURL
	photoWidth?: number;
	photoHeight?: number;
};

type AutrePointRow = {
	chapitre?: string;
	element?: string;     // Élément observé
	moyen?: string;       // Moyen de contrôle
	avis?: string;
	commentaire?: string;
	photo?: string;
	photoWidth?: number;
	photoHeight?: number;
};

interface Report {
	entreprise?: string;
	phase?: string | number;
	noAffaire?: string;
	noRapport?: string;
	proprietaire?: string;
	adresseOuvrage?: string;
	personneRencontree?: string;
	representantSgtec?: string;
	deroulementVisite?: string;
	equipe?: string;
	materiel?: string;
	conclusion?: string;
	investigationPoints?: InvestigationRow[];
	autresPoints?: AutrePointRow[];
	// + champs annexes (badge phase, intervenants, etc.)
}
```

## 6. Personnalisation / Extension
Idées faciles :
- Extraire les couleurs AVIS dans un module `constants/avis.js`.
- Ajouter une table des matières (collecter titres puis générer page dédiée avant pagination finale).
- Ajouter une option “Inclure / exclure images” lors de la génération.
- Internationalisation : encapsuler les libellés dans un dictionnaire.

## 7. Limitations connues
- Pas de compression d’image avancée (base64 direct après redimension basique).
- Pas de persistance hors navigateur (pas encore de backend / DB intégrée).
- Pas de test unitaire sur la sortie PDF (visuel manuel requis).

## 8. Roadmap potentielle
- Légende des couleurs AVIS dans le PDF.
- Export / import JSON de rapport.
- Signature électronique (image + horodatage).
- Sauvegarde auto localStorage.
- Mode lecture seule.

## 9. Licence / Auteurs
Projet interne SGTEC (adapter selon statut juridique). Ajouter une licence (MIT / Proprietary) si nécessaire.

---
Pour toute amélioration, ouvrir une issue ou proposer un patch.

Bonne génération de rapports !

## 10. Déploiement Netlify

### Configuration
Un fichier `netlify.toml` est fourni. Il utilise la commande:
```
npm run build
```
et publie le dossier `.next` avec le plugin officiel `@netlify/plugin-nextjs`.

Assurez-vous que la version de Node sur Netlify est 20+. (Définie via `NODE_VERSION=20`).

### Étapes de déploiement
1. Pousser le repo sur GitHub.
2. Sur Netlify: New Site → Import from Git → choisir le repo.
3. Build command: `npm run build` (déjà pris depuis le `netlify.toml`).
4. Publish directory: `.next` (géré aussi par le plugin, ne pas mettre `out`).
5. Lancer le déploiement.

### Erreurs fréquentes & Solutions
| Problème | Cause | Solution |
|----------|-------|----------|
| "Directory not found: out" | Tentative d'export statique (`next export`) non configurée | Ne pas utiliser `npm run export`; laisser SSR (App Router). |
| "Module not found" pendant build | Cache ou lock incohérent | Activer option Netlify "clear cache and deploy" ou régénérer `package-lock.json`. |
| Erreur Node version | Netlify utilise une version plus ancienne | Forcer `NODE_VERSION=20` dans `netlify.toml`. |
| 404 sur routes dynamiques | Mauvaise config de redirection | Garder le plugin Next; ne pas surcharger avec un `_redirects` incompatible. |

### Export statique ?
L’application dépend du localStorage et d’interactions client; un export statique complet n’est pas nécessaire. Garder le mode par défaut (SSR/Edge) est plus simple.

### Débogage
Consulter les logs Netlify: onglet Deploy → logs build. Rechercher les lignes `@netlify/plugin-nextjs` pour vérifier l’injection des fonctions.

Si besoin d’optimisation: activer bundling stand‑alone dans `next.config.ts` plus tard.
