// Configuration de l'environnement pour l'application
export const ENV_CONFIG = {
  // Détection de l'environnement
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Configuration des erreurs
  errors: {
    // En développement : montrer tous les détails pour le debug
    showDetailedErrors: process.env.NODE_ENV !== 'production',
    showStackTrace: process.env.NODE_ENV === 'development',
    logAllErrors: true,
    
    // Messages d'erreur selon l'environnement
    messages: {
      development: {
        authFailed: 'Authentification échouée: vérifiez vos identifiants',
        validationError: 'Erreur de validation des données saisies',
        serverError: 'Erreur serveur - voir les logs pour plus de détails',
        rateLimited: 'Trop de tentatives - limitation de débit activée',
        securityViolation: 'Violation de sécurité détectée dans la requête'
      },
      production: {
        authFailed: 'Identifiants incorrects',
        validationError: 'Données invalides',
        serverError: 'Erreur interne du serveur',
        rateLimited: 'Trop de tentatives. Veuillez patienter.',
        securityViolation: 'Accès refusé'
      }
    }
  },

  // Configuration de sécurité
  security: {
    // Logs de sécurité plus détaillés en dev
    logSecurityEvents: true,
    logSuspiciousActivity: true,
    
    // Rate limiting plus permissif en développement
    rateLimits: {
      development: {
        login: { attempts: 10, window: 5 * 60 * 1000 }, // 10 tentatives / 5 min
        register: { attempts: 5, window: 5 * 60 * 1000 },
        reports: { attempts: 50, window: 60 * 1000 }
      },
      production: {
        login: { attempts: 5, window: 15 * 60 * 1000 }, // 5 tentatives / 15 min
        register: { attempts: 3, window: 10 * 60 * 1000 },
        reports: { attempts: 20, window: 60 * 1000 }
      }
    }
  },

  // Configuration des notifications utilisateur
  notifications: {
    // En dev : montrer plus d'informations pour le debug
    showDebugInfo: process.env.NODE_ENV === 'development',
    defaultDuration: process.env.NODE_ENV === 'development' ? 7000 : 4000,
    
    // Types de notifications selon le contexte
    types: {
      success: {
        icon: '✅',
        className: 'bg-green-500 text-white',
        duration: 3000
      },
      error: {
        icon: '❌', 
        className: 'bg-red-500 text-white',
        duration: 5000
      },
      warning: {
        icon: '⚠️',
        className: 'bg-yellow-500 text-black',
        duration: 4000
      },
      info: {
        icon: 'ℹ️',
        className: 'bg-blue-500 text-white',
        duration: 3000
      },
      debug: {
        icon: '🔧',
        className: 'bg-gray-500 text-white',
        duration: 6000,
        showOnlyInDev: true
      }
    }
  },

  // Configuration de l'API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: process.env.NODE_ENV === 'development' ? 10000 : 5000,
    
    // En développement : plus de détails dans les logs
    logRequests: process.env.NODE_ENV === 'development',
    logResponses: process.env.NODE_ENV === 'development',
  },

  // Configuration de la base de données
  database: {
    // En dev : logs SQL plus détaillés
    logQueries: process.env.NODE_ENV === 'development',
    logSlowQueries: true,
    connectionTimeout: process.env.NODE_ENV === 'development' ? 30000 : 10000
  }
};

// Fonction utilitaire pour obtenir le message d'erreur approprié
export function getErrorMessage(errorType, originalMessage = '') {
  const env = ENV_CONFIG.isDevelopment ? 'development' : 'production';
  const messages = ENV_CONFIG.errors.messages[env];
  
  // En développement, préfixer avec des détails supplémentaires
  if (ENV_CONFIG.isDevelopment && originalMessage) {
    return `${messages[errorType] || messages.serverError} (Debug: ${originalMessage})`;
  }
  
  return messages[errorType] || messages.serverError;
}

// Fonction pour logger selon l'environnement
export function logError(error, context = {}) {
  const timestamp = new Date().toISOString();
  
  if (ENV_CONFIG.isDevelopment) {
    console.group(`🚨 ERREUR [${timestamp}]`);
    console.error('Message:', error.message);
    console.error('Type:', error.type || 'Unknown');
    console.error('Context:', context);
    if (error.stack && ENV_CONFIG.errors.showStackTrace) {
      console.error('Stack:', error.stack);
    }
    console.groupEnd();
  } else {
    // Log minimal en production
    console.error(`ERROR [${timestamp}]:`, {
      type: error.type || 'Unknown',
      ip: context.ip || 'Unknown',
      action: context.action || 'Unknown'
    });
  }
}

// Fonction pour logger les événements de sécurité
export function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  
  if (ENV_CONFIG.security.logSecurityEvents) {
    if (ENV_CONFIG.isDevelopment) {
      console.group(`🛡️ SÉCURITÉ [${timestamp}]`);
      console.warn('Événement:', event);
      console.warn('Détails:', details);
      console.groupEnd();
    } else {
      console.warn(`SECURITY [${timestamp}]:`, {
        event,
        ip: details.ip || 'Unknown',
        severity: details.severity || 'Medium'
      });
    }
  }
}

// Configuration des headers de sécurité selon l'environnement
export function getSecurityHeaders() {
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  if (ENV_CONFIG.isDevelopment) {
    // En développement : CSP plus permissive pour le debug
    baseHeaders['Content-Security-Policy'] = `
      default-src 'self'; 
      script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
      style-src 'self' 'unsafe-inline'; 
      img-src 'self' data: blob:;
      font-src 'self' data:;
    `.replace(/\s+/g, ' ').trim();
  } else {
    // En production : CSP stricte
    baseHeaders['Content-Security-Policy'] = `
      default-src 'self'; 
      script-src 'self'; 
      style-src 'self' 'unsafe-inline'; 
      img-src 'self' data:; 
      font-src 'self';
    `.replace(/\s+/g, ' ').trim();
  }

  return baseHeaders;
}