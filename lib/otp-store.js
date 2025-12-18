// Stockage temporaire des OTP en mémoire
const otpStore = new Map();

// Générer un code OTP à 6 chiffres
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Stocker un OTP avec expiration de 10 minutes
export function storeOTP(email, otp) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email.toLowerCase(), { otp, expiresAt });
  
  // Nettoyer automatiquement après expiration
  setTimeout(() => {
    otpStore.delete(email.toLowerCase());
  }, 10 * 60 * 1000);
}

// Vérifier un OTP
export function verifyOTP(email, otp) {
  const stored = otpStore.get(email.toLowerCase());
  
  if (!stored) {
    return { valid: false, error: 'Code expiré ou invalide' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: 'Code expiré' };
  }
  
  if (stored.otp !== otp) {
    return { valid: false, error: 'Code incorrect' };
  }
  
  // Supprimer après vérification réussie
  otpStore.delete(email.toLowerCase());
  return { valid: true };
}

// Supprimer un OTP
export function deleteOTP(email) {
  otpStore.delete(email.toLowerCase());
}
