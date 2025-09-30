// Gestionnaire d'erreurs avec différents niveaux selon l'environnement

// Fonction pour détecter l'environnement de manière dynamique
function isDevelopmentMode() {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

function isTestMode() {
  return process.env.NODE_ENV === 'test';
}

function isProductionMode() {
  return process.env.NODE_ENV === 'production';
}

// Messages d'erreur génériques pour la production
const PRODUCTION_MESSAGES = {
  // Erreurs d'authentification
  INVALID_CREDENTIALS: 'Identifiants incorrects',
  RATE_LIMIT_EXCEEDED: 'Trop de tentatives. Veuillez patienter.',
  ACCOUNT_LOCKED: 'Compte temporairement verrouillé',
  
  // Erreurs de validation
  INVALID_INPUT: 'Données invalides',
  VALIDATION_ERROR: 'Erreur de validation des données',
  
  // Erreurs système
  DATABASE_ERROR: 'Erreur de base de données',
  SERVER_ERROR: 'Erreur interne du serveur',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Action interdite',
  NOT_FOUND: 'Ressource non trouvée',
  
  // Erreurs de sécurité
  SUSPICIOUS_ACTIVITY: 'Activité suspecte détectée',
  SECURITY_VIOLATION: 'Violation de sécurité',
  MALICIOUS_INPUT: 'Données potentiellement malveillantes détectées'
};

// Types d'erreurs et leurs codes
export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  DATABASE: 'DATABASE_ERROR',
  SECURITY: 'SECURITY_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR'
};

export class AppError extends Error {
  constructor(type, message, details = null, statusCode = 500) {
    super(message);
    this.type = type;
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

// Fonction pour formater les erreurs selon l'environnement
export function formatError(error, req = null) {
  const errorResponse = {
    success: false,
    timestamp: new Date().toISOString()
  };

  // En développement/test : afficher tous les détails
  if (isDevelopmentMode() || isTestMode()) {
    errorResponse.error = error.message || 'Erreur inconnue';
    errorResponse.type = error.type || 'UNKNOWN_ERROR';
    errorResponse.statusCode = error.statusCode || 500;
    
    if (error.details) {
      errorResponse.details = error.details;
    }
    
    if (error.stack) {
      errorResponse.stack = error.stack;
    }
    
    if (req) {
      errorResponse.request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      };
    }
    
    // Log détaillé pour le développement
    console.error('🚨 ERREUR DÉTAILLÉE (DEV MODE):', {
      message: error.message,
      type: error.type,
      stack: error.stack,
      details: error.details,
      timestamp: errorResponse.timestamp
    });
    
  } else {
    // En production : messages génériques seulement
    const genericMessage = PRODUCTION_MESSAGES[error.type] || PRODUCTION_MESSAGES.SERVER_ERROR;
    errorResponse.error = genericMessage;
    
    // Log minimal pour la production (sans données sensibles)
    console.error('⚠️ ERREUR PRODUCTION:', {
      type: error.type || 'UNKNOWN',
      statusCode: error.statusCode || 500,
      timestamp: errorResponse.timestamp,
      ip: req?.headers.get('x-forwarded-for') || 'unknown'
    });
  }
  
  return errorResponse;
}

// Middleware pour capturer les erreurs non gérées
export function handleApiError(error, req) {
  let appError;
  
  // Convertir les erreurs standard en AppError
  if (!(error instanceof AppError)) {
    // Erreurs de base de données
    if (error.code === 'ER_DUP_ENTRY') {
      appError = new AppError(
        ERROR_TYPES.DATABASE,
        'Données déjà existantes',
        { sqlCode: error.code },
        409
      );
    } else if (error.code?.startsWith('ER_')) {
      appError = new AppError(
        ERROR_TYPES.DATABASE,
        'Erreur de base de données',
        { sqlCode: error.code },
        500
      );
    } else if (error.name === 'ValidationError') {
      appError = new AppError(
        ERROR_TYPES.VALIDATION,
        error.message,
        { validationErrors: error.details },
        400
      );
    } else {
      appError = new AppError(
        ERROR_TYPES.SERVER,
        error.message || 'Erreur interne',
        { originalError: error.name },
        500
      );
    }
  } else {
    appError = error;
  }
  
  return formatError(appError, req);
}

// Fonction utilitaire pour les erreurs de validation
export function createValidationError(message, details = null) {
  return new AppError(ERROR_TYPES.VALIDATION, message, details, 400);
}

// Fonction utilitaire pour les erreurs d'authentification
export function createAuthError(message, details = null) {
  return new AppError(ERROR_TYPES.AUTH, message, details, 401);
}

// Fonction utilitaire pour les erreurs de sécurité
export function createSecurityError(message, details = null) {
  return new AppError(ERROR_TYPES.SECURITY, message, details, 403);
}

// Fonction utilitaire pour les erreurs de rate limiting
export function createRateLimitError(message, details = null) {
  return new AppError(ERROR_TYPES.RATE_LIMIT, message, details, 429);
}

// Configuration des logs selon l'environnement
export const LOG_CONFIG = {
  development: {
    showFullErrors: true,
    showRequestDetails: true,
    showStackTrace: true,
    logToConsole: true,
    logToFile: false
  },
  test: {
    showFullErrors: true,
    showRequestDetails: false,
    showStackTrace: false,
    logToConsole: false,
    logToFile: false
  },
  production: {
    showFullErrors: false,
    showRequestDetails: false,
    showStackTrace: false,
    logToConsole: true,
    logToFile: true
  }
};