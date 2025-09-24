"use client";

export default function Header({ onNewReport }) {
  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <img src="/logo_couleur.png" alt="Logo" className="logo rounded-md" />
        <div>
          <h1 className="text-2xl font-bold">Suivi Chantier</h1>
          <div className="text-sm muted">Gestion des rapports et contrôles</div>
        </div>
      </div>
      <div>
        <nav className="flex items-center gap-3">
          <button className="btn-primary" onClick={onNewReport}>Nouveau rapport</button>
          <button className="px-3 py-1 border rounded">Export</button>
        </nav>
      </div>
    </header>
  );
}
