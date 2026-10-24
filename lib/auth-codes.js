// Codes à 6 chiffres envoyés par email : vérification de compte et mot de passe oublié.
import crypto from 'crypto';
import { userRepo } from './repositories/user.repository.js';
import { sendOTPEmail } from './email-service.js';

export const CODE_TTL_MS = 10 * 60 * 1000;   // 10 minutes
export const CODE_MAX_ATTEMPTS = 5;           // au-delà, le code est détruit

const TOO_MANY = 'Trop de tentatives. Demandez un nouveau code.';
const EXPIRED = 'Code invalide ou expiré. Demandez un nouveau code.';

// Générateur cryptographique (Math.random est prévisible)
export function generateCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

// Comparaison à temps constant
function codesMatch(expected, given) {
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(given ?? ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Compare `given` au code de la ligne `row` de `table` et compte l'essai raté.
 * Au 5e échec, la ligne est supprimée : il faut redemander un code.
 * À appeler dans une transaction, après un SELECT … FOR UPDATE de la ligne.
 */
async function checkWithAttempts(conn, table, row, expected, given) {
  if (row.tentatives >= CODE_MAX_ATTEMPTS) {
    await conn.query(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
    return { ok: false, error: TOO_MANY };
  }
  if (codesMatch(expected, given)) return { ok: true };

  const left = CODE_MAX_ATTEMPTS - row.tentatives - 1;
  if (left <= 0) {
    await conn.query(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
    return { ok: false, error: TOO_MANY };
  }
  await conn.query(`UPDATE ${table} SET tentatives = tentatives + 1 WHERE id = ?`, [row.id]);
  return {
    ok: false,
    error: `Code incorrect. Il vous reste ${left} essai${left > 1 ? 's' : ''}.`,
  };
}

/**
 * Crée un code de vérification pour `user` (ligne Utilisateur) et l'envoie
 * à SON adresse. Le code est toujours lié au couple (id, email) du compte :
 * c'est ce qui empêche de valider le compte de quelqu'un d'autre.
 */
export async function issueVerificationCode(user) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await userRepo.raw('DELETE FROM otp_verification WHERE user_id = ?', [user.id_utilisateur]);
  await userRepo.raw(
    'INSERT INTO otp_verification (user_id, email, otp_code, expires_at) VALUES (?, ?, ?, ?)',
    [user.id_utilisateur, user.email, code, expiresAt]
  );

  return sendOTPEmail(user.email, code, `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email);
}

/**
 * Vérifie le code de vérification d'email. En cas de succès, renvoie l'id du compte.
 * La jointure exige que l'email du code soit celui du compte.
 */
export async function checkVerificationCode(conn, email, code) {
  const [rows] = await conn.query(
    `SELECT o.* FROM otp_verification o
     JOIN Utilisateur u ON u.id_utilisateur = o.user_id AND u.email = o.email
     WHERE o.email = ? AND o.expires_at > NOW()
     ORDER BY o.id DESC LIMIT 1 FOR UPDATE`,
    [email]
  );
  if (!rows.length) return { ok: false, error: EXPIRED };

  const row = rows[0];
  const result = await checkWithAttempts(conn, 'otp_verification', row, row.otp_code, code);
  return result.ok ? { ok: true, userId: row.user_id } : result;
}

/**
 * Vérifie le code de réinitialisation de mot de passe (sans le consommer).
 */
export async function checkResetCode(conn, email, code) {
  const [rows] = await conn.query(
    `SELECT * FROM PasswordReset
     WHERE email = ? AND used = 0 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    [email]
  );
  if (!rows.length) return { ok: false, error: EXPIRED };

  const row = rows[0];
  const result = await checkWithAttempts(conn, 'PasswordReset', row, row.code, code);
  return result.ok ? { ok: true, reset: row } : result;
}
