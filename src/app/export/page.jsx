'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const MODULES = [
  { id: 'taches',   label: 'Tâches',             icon: '📋' },
  { id: 'pointage', label: 'Pointage',            icon: '⏱️' },
  { id: 'budget',   label: 'Budget & Dépenses',   icon: '💰' },
  { id: 'materiel', label: 'Matériel',             icon: '🏗️' },
  { id: 'hse',      label: 'HSE (Incidents)',      icon: '🛡️' },
  { id: 'journal',  label: 'Journal de chantier',  icon: '📓' },
  { id: 'equipe',   label: 'Équipe',               icon: '👥' },
];

export default function ExportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [chantiers, setChantiers] = useState([]);
  const [chantierId, setChantierId] = useState('');
  const [selectedModules, setSelectedModules] = useState(new Set(MODULES.map((m) => m.id)));
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirection si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  // Charger la liste des chantiers
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/chantiers')
      .then((r) => r.json())
      .then((data) => {
        const list = data.data || data.chantiers || data || [];
        setChantiers(Array.isArray(list) ? list : []);
      })
      .catch(() => setError('Impossible de charger les chantiers'));
  }, [status]);

  function toggleModule(id) {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedModules.size === MODULES.length) {
      setSelectedModules(new Set());
    } else {
      setSelectedModules(new Set(MODULES.map((m) => m.id)));
    }
  }

  async function handleExport() {
    if (!chantierId) return setError('Sélectionnez un chantier');
    if (selectedModules.size === 0) return setError('Sélectionnez au moins un module');
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams({
        chantier_id: chantierId,
        modules: [...selectedModules].join(','),
      });
      if (dateDebut) params.set('date_debut', dateDebut);
      if (dateFin)   params.set('date_fin', dateFin);

      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur ${res.status}`);
      }

      // Téléchargement du fichier
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '')
        || `export_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') return null;

  return (
    <div style={{ minHeight: '100vh', background: '#E8ECF0', padding: '2rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Titre */}
        <h1 style={{
          fontSize: '1.6rem', fontWeight: 700, color: '#1E3A5F',
          marginBottom: '0.25rem',
        }}>
          Export chantier
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Générez un fichier Excel avec les données de votre chantier.
        </p>

        {/* Card principale */}
        <div style={{
          background: '#E8ECF0',
          borderRadius: 16,
          padding: '2rem',
          boxShadow: '8px 8px 16px #c5c9cd, -8px -8px 16px #ffffff',
        }}>

          {/* Sélecteur chantier */}
          <label style={labelStyle}>Chantier</label>
          <select
            value={chantierId}
            onChange={(e) => setChantierId(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Sélectionnez un chantier —</option>
            {chantiers.map((c) => (
              <option key={c.id_chantier} value={c.id_chantier}>
                {c.nom}
              </option>
            ))}
          </select>

          {/* Période */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
            <div>
              <label style={labelStyle}>Date début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Date fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: -8, marginBottom: 16 }}>
            Laissez vide pour exporter toutes les données.
          </p>

          {/* Modules */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Modules à exporter</label>
            <button onClick={toggleAll} style={linkBtnStyle}>
              {selectedModules.size === MODULES.length ? 'Tout décocher' : 'Tout cocher'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {MODULES.map((mod) => (
              <label
                key={mod.id}
                style={{
                  ...checkboxCardStyle,
                  ...(selectedModules.has(mod.id) ? checkboxCardActive : {}),
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedModules.has(mod.id)}
                  onChange={() => toggleModule(mod.id)}
                  style={{ display: 'none' }}
                />
                <span style={{ marginRight: 8 }}>{mod.icon}</span>
                {mod.label}
              </label>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>
          )}

          {/* Bouton export */}
          <button
            onClick={handleExport}
            disabled={loading}
            style={{
              ...exportBtnStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Génération en cours…' : 'Télécharger l\'export Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#1E3A5F',
  marginBottom: '0.4rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  borderRadius: 10,
  border: 'none',
  outline: 'none',
  fontSize: '0.95rem',
  color: '#334155',
  background: '#E8ECF0',
  boxShadow: 'inset 3px 3px 6px #c5c9cd, inset -3px -3px 6px #ffffff',
  boxSizing: 'border-box',
};

const checkboxCardStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.65rem 0.9rem',
  borderRadius: 10,
  fontSize: '0.9rem',
  color: '#475569',
  background: '#E8ECF0',
  boxShadow: 'inset 2px 2px 4px #c5c9cd, inset -2px -2px 4px #ffffff',
  transition: 'all 0.15s ease',
  userSelect: 'none',
};

const checkboxCardActive = {
  color: '#1E3A5F',
  fontWeight: 600,
  boxShadow: '3px 3px 6px #c5c9cd, -3px -3px 6px #ffffff',
  background: '#E8ECF0',
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#F97316',
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
  padding: 0,
};

const exportBtnStyle = {
  width: '100%',
  marginTop: '1.5rem',
  padding: '0.85rem',
  borderRadius: 12,
  border: 'none',
  fontSize: '1rem',
  fontWeight: 700,
  color: '#ffffff',
  background: 'linear-gradient(135deg, #F97316, #ea580c)',
  boxShadow: '4px 4px 10px #c5c9cd, -2px -2px 6px #ffffff',
  transition: 'all 0.15s ease',
};