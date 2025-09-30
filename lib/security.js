// Module de validation et sécurité pour l'API
import validator from 'validator';
import { SECURITY_CONFIG, SECURITY_MESSAGES } from './security-config.js';

/**
 * Valide et nettoie les données d'entrée pour éviter les injections
 */

// Validation de l'email
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email requis' };
  }
  
  const cleanEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(cleanEmail)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }
  
  if (cleanEmail.length > 150) {
    return { isValid: false, error: 'Email trop long (max 150 caractères)' };
  }
  
  return { isValid: true, value: cleanEmail };
}

// Validation du mot de passe
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Mot de passe requis' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Mot de passe trop long (max 128 caractères)' };
  }
  
  // Vérifier la complexité du mot de passe
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins une lettre' };
  }
  
  return { isValid: true, value: password };
}

// Validation des noms (prénom, nom)
export function validateName(name, fieldName = 'nom') {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: `${fieldName} requis` };
  }
  
  const cleanName = name.trim();
  
  if (cleanName.length < 2) {
    return { isValid: false, error: `${fieldName} trop court (min 2 caractères)` };
  }
  
  if (cleanName.length > 100) {
    return { isValid: false, error: `${fieldName} trop long (max 100 caractères)` };
  }
  
  // Autoriser seulement lettres, espaces, tirets et apostrophes
  if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(cleanName)) {
    return { isValid: false, error: `${fieldName} contient des caractères invalides` };
  }
  
  return { isValid: true, value: cleanName };
}

// Validation des IDs numériques
export function validateId(id, fieldName = 'ID') {
  if (!id) {
    return { isValid: false, error: `${fieldName} requis` };
  }
  
  const numericId = parseInt(id);
  
  if (isNaN(numericId) || numericId <= 0) {
    return { isValid: false, error: `${fieldName} invalide` };
  }
  
  return { isValid: true, value: numericId };
}

// Validation des données de rapport
export function validateReportData(data) {
  const errors = [];
  
  // Validation des champs texte
  const textFields = ['entreprise', 'proprietaire', 'maitreOuvrage', 'centreTravaux'];
  textFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      if (data[field].length > 255) {
        errors.push(`${field} trop long (max 255 caractères)`);
      }
      // Nettoyer les caractères dangereux
      data[field] = data[field].trim().replace(/[<>'"]/g, '');
    }
  });
  
  // Validation des numéros
  if (data.phase && (isNaN(data.phase) || data.phase < 1 || data.phase > 10)) {
    errors.push('Phase invalide (doit être entre 1 et 10)');
  }
  
  // Validation des dates
  if (data.dateIntervention && !validator.isISO8601(data.dateIntervention)) {
    errors.push('Date d\'intervention invalide');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    cleanData: data
  };
}

// Protection contre le brute force - Limitation de taux
const loginAttempts = new Map();

export function rateLimitCheck(ip, maxAttempts = SECURITY_CONFIG.rateLimits.login.maxAttempts, windowMs = SECURITY_CONFIG.rateLimits.login.windowMs) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, resetTime: now + windowMs };
  
  if (now > attempts.resetTime) {
    // Réinitialiser le compteur
    attempts.count = 0;
    attempts.resetTime = now + windowMs;
  }
  
  attempts.count++;
  loginAttempts.set(ip, attempts);
  
  return {
    allowed: attempts.count <= maxAttempts,
    remainingAttempts: Math.max(0, maxAttempts - attempts.count),
    resetTime: attempts.resetTime
  };
}

// Nettoyer les données pour éviter XSS
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Supprimer les caractères HTML dangereux
    .substring(0, 1000); // Limiter la longueur
}

// Validation générale des données JSON
export function validateRequestBody(body, requiredFields = []) {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Données invalides' };
  }
  
  const missingFields = requiredFields.filter(field => !body[field]);
  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      error: `Champs manquants: ${missingFields.join(', ')}` 
    };
  }
  
  return { isValid: true };
}