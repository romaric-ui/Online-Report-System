// Composant pour l'upload d'image de couverture dans le formulaire
'use client';
import { useState, useRef } from 'react';

export default function ImageCoverUpload({ onImageSelect, currentImage = null }) {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');

    // Validation du type de fichier (GIF supprimé)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }

    // Validation de la taille (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Le fichier est trop volumineux. Taille maximum: 10MB.');
      return;
    }

    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Notifier le composant parent
    if (onImageSelect) {
      onImageSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Image de Couverture (Optionnel)
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {preview ? (
          <div className="space-y-4">
            {/* Aperçu de l'image */}
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Aperçu de l'image de couverture"
                className="max-w-full max-h-48 rounded-lg shadow-md"
              />
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={handleButtonClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Changer l'image
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Zone de drop */}
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Cliquez pour sélectionner une image ou glissez-la ici
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP jusqu'à 10MB
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleButtonClick}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Sélectionner une image
            </button>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Informations supplémentaires */}
      <div className="mt-3 text-xs text-gray-500">
        <p>💡 Conseils :</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Utilisez une image haute résolution (au moins 800x600px)</li>
          <li>Format recommandé : JPG ou PNG</li>
          <li>L'image sera redimensionnée automatiquement dans le PDF</li>
        </ul>
      </div>
    </div>
  );
}

// Hook pour gérer l'upload d'image
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadImage = async (file, idRapport, description = '') => {
    if (!file || !idRapport) {
      setError('Fichier et ID rapport requis');
      return null;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('idRapport', idRapport);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch('/api/uploads/cover', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'upload');
      }

      return result;

    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'image. Veuillez réessayer.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateImage = async (file, idRapport, description = '') => {
    if (!file || !idRapport) {
      setError('Fichier et ID rapport requis');
      return null;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('idRapport', idRapport);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch('/api/uploads/cover', {
        method: 'PUT',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      return result;

    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'image. Veuillez réessayer.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadImage,
    updateImage,
    uploading,
    error,
    setError
  };
}