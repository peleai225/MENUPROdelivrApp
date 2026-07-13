import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

function mapFirebaseError(code: string): string {
  const MESSAGES: Record<string, string> = {
    'auth/invalid-phone-number': 'Numéro de téléphone invalide.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
    'auth/invalid-verification-code': 'Code incorrect. Vérifiez et réessayez.',
    'auth/code-expired': 'Code expiré. Demandez un nouveau code.',
    'auth/session-expired': 'Session expirée. Recommencez.',
    'auth/quota-exceeded': 'Quota SMS dépassé. Réessayez plus tard.',
    'auth/missing-phone-number': 'Numéro de téléphone manquant.',
    'auth/captcha-check-failed': 'Vérification échouée. Réessayez.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
  };
  return MESSAGES[code] ?? 'Erreur Firebase. Réessayez.';
}

export type FirebaseConfirmation = FirebaseAuthTypes.ConfirmationResult;

/**
 * Sends an OTP SMS to the given E.164 phone number.
 * Works with test phone numbers added in Firebase Console.
 */
export async function sendPhoneOTP(phoneE164: string): Promise<FirebaseConfirmation> {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneE164);
    return confirmation;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    throw new Error(mapFirebaseError(code));
  }
}

/**
 * Verifies the 6-digit OTP code and returns a Firebase idToken.
 */
export async function verifyPhoneOTP(
  confirmation: FirebaseConfirmation,
  code: string,
): Promise<{ idToken: string; uid: string }> {
  try {
    const result = await confirmation.confirm(code);
    if (!result?.user) throw new Error('Utilisateur non trouvé après vérification.');
    const idToken = await result.user.getIdToken();
    return { idToken, uid: result.user.uid };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    const msg = mapFirebaseError(code);
    // If no firebase code, re-throw the original message
    throw new Error(msg !== 'Erreur Firebase. Réessayez.' ? msg : (err as Error).message ?? msg);
  }
}

/** Converts a Côte d'Ivoire local number (0X XX XX XX XX) to E.164 (+225XXXXXXXXXX). */
export function toE164CI(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('225')) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+225${digits.slice(1)}`;
  return `+225${digits}`;
}
