'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ImportTachesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef(null);

  const [chantiers, setChantiers] = useState([]);
  const [chantierId, setChantierId] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

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

  function handleFile(f) {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'csv', 'tsv'].includes(ext)) {
      return setError('Format accepté : .xlsx, .csv ou .tsv');
    }
    setFile(f);
    setError('');
    setResult(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  }

  async function handleImport() {
    if (!chantierId) return setError('Sélectionnez un chantier');
    if (!file) return setError('Sélectionnez un fichier');
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/chantiers/${chantierId}/taches/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.message || `Erreur ${res.status}`);

      setResult(data.data || data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadTemplate() {
    // Le chantier n'est pas nécessaire pour le template, on prend le premier disponible
    const id = chantierId || chantiers[0]?.id_chantier;
    if (!id) return setError('Aucun chantier disponible');

    const res = await fetch(`/api/chantiers/${id}/taches/import`);
    if (!res.ok) return setError('Erreur lors du téléchargement du template');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PROJECTRA_template_taches.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (status === 'loading') return null;

  return (
    <div style={{ minHeight: '100vh', background: '#E8ECF0', padding: '2rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1E3A5F', marginBottom: '0.25rem' }}>
          Import tâches
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Importez des tâches depuis un fichier Excel ou CSV.
        </p>

        <div style={cardStyle}>

          {/* Chantier */}
          <label style={labelStyle}>Chantier cible</label>
          <select value={chantierId} onChange={(e) => setChantierId(e.target.value)} style={inputStyle}>
            <option value="">— Sélectionnez un chantier —</option>
            {chantiers.map((c) => (
              <option key={c.id_chantier} value={c.id_chantier}>{c.nom}</option>
            ))}
          </select>

          {/* Template */}
          <div style={{ margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={downloadTemplate} style={templateBtnStyle}>
              📥 Télécharger le template
            </button>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Excel avec les colonnes pré-remplies et validations
            </span>
          </div>

          {/* Zone upload */}
          <label style={labelStyle}>Fichier à importer</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              ...dropZoneStyle,
              borderColor: dragging ? '#F97316' : '#cbd5e1',
              background: dragging ? 'rgba(249,115,22,0.04)' : 'transparent',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv,.tsv"
              onChange={(e) => handleFile(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <span style={{ fontSize: '1.4rem' }}>📄</span>
                <p style={{ fontWeight: 600, color: '#1E3A5F', margin: '0.3rem 0 0' }}>{file.name}</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {(file.size / 1024).toFixed(0)} Ko — Cliquez pour changer
                </p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '2rem' }}>📁</span>
                <p style={{ color: '#64748b', margin: '0.3rem 0 0' }}>
                  Glissez un fichier ici ou cliquez pour sélectionner
                </p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>.xlsx, .csv ou .tsv</p>
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}

          {/* Bouton import */}
          <button
            onClick={handleImport}
            disabled={loading || !file || !chantierId}
            style={{
              ...importBtnStyle,
              opacity: (loading || !file || !chantierId) ? 0.5 : 1,
              cursor: (loading || !file || !chantierId) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Import en cours…' : 'Importer les tâches'}
          </button>

          {/* Résultats */}
          {result && (
            <div style={resultCardStyle}>
              <div style={{ display: 'flex', gap: 16, marginBottom: result.errors?.length > 0 ? 16 : 0 }}>
                <div style={statStyle}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1E3A5F' }}>{result.total}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>lignes lues</span>
                </div>
                <div style={statStyle}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a' }}>{result.created}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>créées</span>
                </div>
                {result.skipped > 0 && (
                  <div style={statStyle}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#F59E0B' }}>{result.skipped}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>doublons ignorés</span>
                  </div>
                )}
                {result.errors?.length > 0 && (
                  <div style={statStyle}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ef4444' }}>{result.errors.length}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>erreurs</span>
                  </div>
                )}
              </div>

              {result.errors?.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {result.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: '#ef4444', padding: '0.3rem 0', borderBottom: '1px solid #e2e8f0' }}>
                      <strong>Ligne {err.line}</strong> : {err.errors.join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E3A5F', marginBottom: '0.4rem',
};

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: 10, border: 'none', outline: 'none',
  fontSize: '0.95rem', color: '#334155', background: '#E8ECF0', boxSizing: 'border-box',
  boxShadow: 'inset 3px 3px 6px #c5c9cd, inset -3px -3px 6px #ffffff',
};

const cardStyle = {
  background: '#E8ECF0', borderRadius: 16, padding: '2rem',
  boxShadow: '8px 8px 16px #c5c9cd, -8px -8px 16px #ffffff',
};

const dropZoneStyle = {
  border: '2px dashed #cbd5e1', borderRadius: 12, padding: '2rem', textAlign: 'center',
  cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: '0.5rem',
};

const templateBtnStyle = {
  background: '#E8ECF0', border: 'none', borderRadius: 10, padding: '0.6rem 1rem',
  fontSize: '0.85rem', fontWeight: 600, color: '#1E3A5F', cursor: 'pointer',
  boxShadow: '3px 3px 6px #c5c9cd, -3px -3px 6px #ffffff',
};

const importBtnStyle = {
  width: '100%', marginTop: '1.5rem', padding: '0.85rem', borderRadius: 12,
  border: 'none', fontSize: '1rem', fontWeight: 700, color: '#ffffff',
  background: 'linear-gradient(135deg, #F97316, #ea580c)',
  boxShadow: '4px 4px 10px #c5c9cd, -2px -2px 6px #ffffff',
  transition: 'all 0.15s ease',
};

const resultCardStyle = {
  marginTop: '1.5rem', padding: '1.2rem', borderRadius: 12, background: '#E8ECF0',
  boxShadow: 'inset 3px 3px 6px #c5c9cd, inset -3px -3px 6px #ffffff',
};

const statStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
};