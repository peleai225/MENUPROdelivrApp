// Web stub — @react-native-firebase is native only (Android/iOS).
// On web preview (Expo Go / browser) Firebase Phone Auth is not available.

export type FirebaseConfirmation = { confirm: (code: string) => Promise<never> };

const NOT_SUPPORTED = 'Firebase Phone Auth nécessite un build natif (Android/iOS).';

export async function sendPhoneOTP(_phoneE164: string): Promise<FirebaseConfirmation> {
  throw new Error(NOT_SUPPORTED);
}

export async function verifyPhoneOTP(
  _confirmation: FirebaseConfirmation,
  _code: string,
): Promise<{ idToken: string; uid: string }> {
  throw new Error(NOT_SUPPORTED);
}

export function toE164CI(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('225')) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+225${digits.slice(1)}`;
  return `+225${digits}`;
}
