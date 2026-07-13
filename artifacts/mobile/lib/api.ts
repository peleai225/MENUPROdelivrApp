import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const TOKEN_KEY = 'menupro_token';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let unauthorizedHandler: (() => void) | null = null;

/** Registered by AuthProvider so a 401 response can clear local session state. */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from an Axios/MenuPro API error. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      message?: string;
      error?: string;
      errors?: Record<string, string[]>;
    } | undefined;
    // Laravel validation errors: pick the first field message
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.[0]) return first[0];
    }
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.response?.status === 401) return 'Session expirée. Veuillez vous reconnecter.';
    if (error.response?.status === 422) return 'Données invalides. Vérifiez votre commande.';
    if (error.response?.status === 403) return 'Action non autorisée.';
    if (error.response?.status === 404) return 'Ressource introuvable.';
    if (error.response?.status && error.response.status >= 500) return 'Erreur serveur. Réessayez dans quelques instants.';
    if (error.code === 'ECONNABORTED') return 'La connexion a expiré. Réessayez.';
    if (!error.response) return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }
  return fallback;
}

export default api;
