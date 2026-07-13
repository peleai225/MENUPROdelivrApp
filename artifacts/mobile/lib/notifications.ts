import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('orders', {
    name: 'Suivi des commandes',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#f97316',
  });
  channelReady = true;
}

export async function getNotificationPermissionStatus() {
  if (Platform.OS === 'web') return 'unsupported' as const;
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** Requests OS notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return !!requested.granted;
}

/**
 * Fires a local notification immediately.
 *
 * MenuPro's backend is an external, read-only API we don't control, so we can't register
 * device push tokens with it for true server-sent push. Instead, order-status changes detected
 * while polling `trackOrder` trigger this local notification — same result for the user (an alert
 * about their order) without requiring backend changes.
 */
export async function notifyLocally(title: string, body: string) {
  if (Platform.OS === 'web') return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}
