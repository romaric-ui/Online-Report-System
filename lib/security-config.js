// Configuration de sécurité centralisée
export const SECURITY_CONFIG = {
  // Rate limiting configurations
  rateLimits: {
    // Connexion et inscription
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    register: {
      maxAttempts: 3,
      windowMs: 10 * 60 * 1000, // 10 minutes
    },
    
    // Opérations sur les rapports  
    createReport: {
      maxAttempts: 10,
      windowMs: 60 * 1000, // 1 minute
    },
    updateReport: {
      maxAttempts: 20,
      windowMs: 60 * 1000, // 1 minute
    },
    deleteReport: {
      maxAttempts: 10,
      windowMs: 60 * 1000, // 1 minute
    },
    
    // Téléchargements
    download: {
      maxAttempts: 50,
      windowMs: 60 * 1000, // 1 minute
    }
  },
  
  // Validation des mots de passe
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    commonPatterns: [
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /^admin/i,
      /^guest/i
    ]
  },
  
  // Limites de champs
  fieldLimits: {
    name: { min: 2, max: 100 },
    email: { max: 254 },
    text: { max: 1000 },
    longText: { max: 5000 },
    contractNumber: { min: 1, max: 50 },
    phase: { min: 1, max: 10 }
  },
  
  // Patterns dangereux à bloquer
  dangerousPatterns: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /import\s+/gi,
    /@import/gi,
    /\/\*[\s\S]*?\*\//g, // Commentaires CSS
    /<!--[\s\S]*?-->/g    // Commentaires HTML
  ],
  
  // Caractères autorisés par type de champ
  allowedChars: {
    name: /^[a-zA-ZÀ-ÿ\s\-'.]{2,100}$/,
    contractNumber: /^[A-Z0-9\-_]{1,50}$/i,
    alphanumeric: /^[a-zA-Z0-9\s\-_.]{1,255}$/,
    numeric: /^\d+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  // Configuration de hachage
  bcrypt: {
    saltRounds: 12
  },
  
  // Configuration JWT
  jwt: {
    expiresIn: '24h',
    algorithm: 'HS256'
  }
};

// Messages d'erreur standardisés
export const SECURITY_MESSAGES = {
  invalidInput: 'Données d\'entrée invalides',
  rateLimitExceeded: 'Trop de tentatives. Veuillez patienter avant de réessayer.',
  invalidCredentials: 'Identifiants incorrects',
  accountLocked: 'Compte temporairement verrouillé suite à trop de tentatives de connexion',
  passwordTooWeak: 'Mot de passe trop faible. Il doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.',
  emailExists: 'Cette adresse email est déjà utilisée',
  userNotFound: 'Utilisateur non trouvé',
  unauthorizedAccess: 'Accès non autorisé',
  suspiciousActivity: 'Activité suspecte détectée',
  dataIntegrityError: 'Erreur d\'intégrité des données'
};