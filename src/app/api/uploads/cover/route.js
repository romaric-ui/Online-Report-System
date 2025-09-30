// API pour gérer l'upload des images de couverture
import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { saveImageCouverture, updateImageCouverture } from '../../../../../lib/database';
import { validateReportData } from '../../../../../lib/security';

// Configuration des types d'images acceptés (GIF supprimé)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'covers');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const idRapport = formData.get('idRapport');

    // Validation des données
    if (!file || !idRapport) {
      return Response.json(
        { error: 'Image et ID du rapport requis' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Type de fichier non supporté. Types acceptés: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `Fichier trop volumineux. Taille maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Créer le dossier d'upload s'il n'existe pas
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Générer un nom unique pour le fichier
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2);
    const fileExtension = path.extname(file.name);
    const nomStockage = `cover_${idRapport}_${timestamp}_${randomSuffix}${fileExtension}`;
    const cheminComplet = path.join(UPLOAD_DIR, nomStockage);
    const cheminRelatif = `/uploads/covers/${nomStockage}`;

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(cheminComplet, buffer);

    // Obtenir les dimensions de l'image (optionnel)
    let largeur = null;
    let hauteur = null;
    
    // Pour obtenir les dimensions, vous pouvez utiliser une librairie comme 'sharp' ou 'image-size'
    // npm install sharp
    // const sharp = require('sharp');
    // const metadata = await sharp(buffer).metadata();
    // largeur = metadata.width;
    // hauteur = metadata.height;

    // Données de l'image pour la base de données
    const imageData = {
      nomFichier: file.name,
      nomStockage: nomStockage,
      cheminFichier: cheminRelatif,
      typeMime: file.type,
      tailleFichier: file.size,
      largeur: largeur,
      hauteur: hauteur,
      description: formData.get('description') || null
    };

    // Sauvegarder en base de données
    const result = await saveImageCouverture(idRapport, imageData);

    return Response.json({
      success: true,
      message: 'Image de couverture uploadée avec succès',
      image: {
        id: result.insertId,
        chemin: cheminRelatif,
        nomFichier: file.name,
        taille: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Erreur upload image:', error);
    return Response.json(
      { error: 'Erreur lors de l\'upload de l\'image' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const idRapport = formData.get('idRapport');

    if (!file || !idRapport) {
      return Response.json(
        { error: 'Image et ID du rapport requis' },
        { status: 400 }
      );
    }

    // Mêmes validations que pour POST
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Type de fichier non supporté. Types acceptés: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `Fichier trop volumineux. Taille maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Traitement similaire à POST mais avec updateImageCouverture
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2);
    const fileExtension = path.extname(file.name);
    const nomStockage = `cover_${idRapport}_${timestamp}_${randomSuffix}${fileExtension}`;
    const cheminComplet = path.join(UPLOAD_DIR, nomStockage);
    const cheminRelatif = `/uploads/covers/${nomStockage}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(cheminComplet, buffer);

    const imageData = {
      nomFichier: file.name,
      nomStockage: nomStockage,
      cheminFichier: cheminRelatif,
      typeMime: file.type,
      tailleFichier: file.size,
      largeur: null,
      hauteur: null,
      description: formData.get('description') || null
    };

    // Mettre à jour l'image existante
    await updateImageCouverture(idRapport, imageData);

    return Response.json({
      success: true,
      message: 'Image de couverture mise à jour avec succès',
      image: {
        chemin: cheminRelatif,
        nomFichier: file.name,
        taille: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour image:', error);
    return Response.json(
      { error: 'Erreur lors de la mise à jour de l\'image' },
      { status: 500 }
    );
  }
}