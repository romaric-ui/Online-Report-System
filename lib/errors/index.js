export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
export class ValidationError extends AppError {
  constructor(message = 'Données invalides', details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}
export class AuthenticationError extends AppError {
  constructor(message = 'Authentification requise') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}
export class AuthorizationError extends AppError {
  constructor(message = 'Accès non autorisé') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND');
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflit de données') {
    super(message, 409, 'CONFLICT');
  }
}
export class RateLimitError extends AppError {
  constructor(message = 'Trop de requêtes', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}
export class PlanLimitError extends AppError {
  constructor(message = 'Limite du plan atteinte', upgradeHint = null) {
    super(message, 403, 'PLAN_LIMIT_EXCEEDED');
    this.upgradeHint = upgradeHint;
  }
}
