// Badge de statut commun : une couleur fixe par statut, dans toute l'app.
// Les couleurs viennent des variables --st-* de globals.css (clair et sombre).

const TONS = {
  neutre:  'bg-[var(--st-neutre-bg)] text-[var(--st-neutre-fg)]',
  cours:   'bg-[var(--st-cours-bg)] text-[var(--st-cours-fg)]',
  attente: 'bg-[var(--st-attente-bg)] text-[var(--st-attente-fg)]',
  ok:      'bg-[var(--st-ok-bg)] text-[var(--st-ok-fg)]',
  alerte:  'bg-[var(--st-alerte-bg)] text-[var(--st-alerte-fg)]',
};

// Statuts des tâches et des chantiers
export const STATUTS = {
  a_faire:    { label: 'À faire',    ton: 'neutre' },
  planifie:   { label: 'Planifié',   ton: 'neutre' },
  en_cours:   { label: 'En cours',   ton: 'cours' },
  en_attente: { label: 'En attente', ton: 'attente' },
  en_pause:   { label: 'En pause',   ton: 'attente' },
  termine:    { label: 'Terminé',    ton: 'ok' },
  en_retard:  { label: 'En retard',  ton: 'alerte' },
  annule:     { label: 'Annulé',     ton: 'alerte' },
};

export function statutLabel(statut) {
  return STATUTS[statut]?.label ?? statut;
}

export default function StatutBadge({ statut, label, className = '' }) {
  const def = STATUTS[statut];
  const ton = TONS[def?.ton] ?? TONS.neutre;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${ton} ${className}`}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
      {label ?? def?.label ?? statut}
    </span>
  );
}
