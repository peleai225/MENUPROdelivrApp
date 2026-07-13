import React, { useEffect, useRef, useCallback } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useCheckoutStore } from '@/lib/checkoutStore';
import { trackOrder } from '@/lib/endpoints';
import { formatMinutes, getOrderStatusMeta } from '@/lib/format';
import { notifyLocally } from '@/lib/notifications';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TrackingMap } from '@/components/TrackingMap';
import { ABIDJAN_FALLBACK } from '@/context/LocationContext';
import type { TrackingDriver } from '@/types';

/**
 * Temps réel via WebSocket (Laravel Reverb) sur le canal `order.{token}`.
 * Écoute 3 événements : .driver.assigned, .delivery.status_changed, .driver.location.
 * Fallback polling toutes les 30s si le WebSocket n'est pas disponible.
 */

const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST ?? 'menupro.ci';
const REVERB_KEY = process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? 'menupro_key';
const REVERB_PORT = Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 443);

const STATUS_NOTIFICATION_BODY: Record<string, string> = {
  confirmed: 'Le restaurant a confirmé votre commande.',
  preparing: 'Votre commande est en cours de préparation.',
  ready: 'Votre commande est prête et attend un livreur.',
  delivering: 'Un livreur a récupéré votre commande, elle arrive bientôt !',
  completed: 'Votre commande a été livrée. Bon appétit !',
  cancelled: 'Votre commande a été annulée.',
};

const STEPS: {
  key: 'ordered_at' | 'confirmed_at' | 'preparing_at' | 'driver_assigned_at' | 'picked_up_at' | 'completed_at';
  label: string;
}[] = [
  { key: 'ordered_at', label: 'Commande passée' },
  { key: 'confirmed_at', label: 'Confirmée par le restaurant' },
  { key: 'preparing_at', label: 'En préparation' },
  { key: 'driver_assigned_at', label: 'Livreur assigné' },
  { key: 'picked_up_at', label: 'Récupérée par le livreur' },
  { key: 'completed_at', label: 'Livrée' },
];

// Minimal Pusher-protocol WebSocket client (no npm dependency needed on native)
function usePusherChannel(
  token: string | undefined,
  onDriverAssigned: (driver: TrackingDriver) => void,
  onStatusChanged: () => void,
  onDriverLocation: (lat: number, lng: number) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) return;

    const wsUrl = `wss://${REVERB_HOST}:${REVERB_PORT}/app/${REVERB_KEY}?protocol=7&client=react-native&version=8.0&flash=false`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return; // WebSocket not available (e.g. some Jest envs)
    }
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to the public channel
      ws.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: { auth: '', channel: `order.${token}` },
      }));
      // Keep-alive ping every 25s (Reverb timeout is 30s)
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
        }
      }, 25_000);
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: { event: string; data: string | object };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }
      const payload = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;

      switch (msg.event) {
        case '.driver.assigned':
          if (payload?.driver) onDriverAssigned(payload.driver as TrackingDriver);
          break;
        case '.delivery.status_changed':
          onStatusChanged();
          break;
        case '.driver.location':
          if (payload?.lat != null && payload?.lng != null) {
            onDriverLocation(payload.lat as number, payload.lng as number);
          }
          break;
      }
    };

    ws.onerror = () => {
      // Silent — fallback polling handles the gap
    };

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      ws.close();
      wsRef.current = null;
    };
  }, [token, onDriverAssigned, onStatusChanged, onDriverLocation]);
}

export default function TrackScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const colors = useColors();
  const address = useCheckoutStore((state) => state.address);
  const qc = useQueryClient();

  // Separate live driver state updated by WebSocket location events
  const liveDriverRef = useRef<{ lat: number; lng: number } | null>(null);
  const [liveDriverCoords, setLiveDriverCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  const trackingQuery = useQuery({
    queryKey: ['tracking', token],
    queryFn: () => trackOrder(token as string),
    enabled: !!token,
    // Fallback polling every 30s — WebSocket handles the real-time updates
    refetchInterval: 30_000,
  });

  const data = trackingQuery.data;
  const driver = data?.delivery?.driver;

  // WebSocket handlers (stable refs via useCallback)
  const handleDriverAssigned = useCallback((d: TrackingDriver) => {
    qc.invalidateQueries({ queryKey: ['tracking', token] });
    setLiveDriverCoords({ lat: d.latitude, lng: d.longitude });
  }, [qc, token]);

  const handleStatusChanged = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['tracking', token] });
  }, [qc, token]);

  const handleDriverLocation = useCallback((lat: number, lng: number) => {
    liveDriverRef.current = { lat, lng };
    setLiveDriverCoords({ lat, lng });
  }, []);

  usePusherChannel(token, handleDriverAssigned, handleStatusChanged, handleDriverLocation);

  // Local notifications on status change
  const lastNotifiedStatus = useRef<string | null>(null);
  useEffect(() => {
    const status = data?.order_status;
    if (!status || status === lastNotifiedStatus.current) return;
    const isFirstRead = lastNotifiedStatus.current === null;
    lastNotifiedStatus.current = status;
    if (isFirstRead) return;
    const body = STATUS_NOTIFICATION_BODY[status];
    if (body) {
      notifyLocally(`Commande ${getOrderStatusMeta(status).label.toLowerCase()}`, body).catch(() => {});
    }
  }, [data?.order_status]);

  // Map region: prefer live WebSocket coords, then API driver coords, then delivery address
  const mapRegion = {
    latitude: liveDriverCoords?.lat ?? driver?.latitude ?? address?.latitude ?? ABIDJAN_FALLBACK.latitude,
    longitude: liveDriverCoords?.lng ?? driver?.longitude ?? address?.longitude ?? ABIDJAN_FALLBACK.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const displayDriver = liveDriverCoords && driver
    ? { ...driver, latitude: liveDriverCoords.lat, longitude: liveDriverCoords.lng }
    : driver;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.mapWrap}>
        <TrackingMap region={mapRegion} driver={displayDriver} address={address} />
        <View style={styles.headerOverlay}>
          <ScreenHeader transparent />
        </View>
      </View>

      <ScrollView
        style={[styles.sheet, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.sheetContent}
      >
        <View style={styles.etaRow}>
          <Text style={[styles.etaLabel, { color: colors.mutedForeground }]}>Arrivée estimée</Text>
          <Text style={[styles.etaValue, { color: colors.primary }]}>
            {formatMinutes(data?.estimated_minutes) || '—'}
          </Text>
        </View>

        {displayDriver && (
          <View style={[styles.driverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.driverAvatar, { backgroundColor: colors.accent }]}>
              <Feather name="user" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>{displayDriver.name}</Text>
              <Text style={[styles.driverRating, { color: colors.mutedForeground }]}>★ {displayDriver.rating}</Text>
            </View>
            <Feather
              name="phone-call"
              size={20}
              color={colors.primary}
              onPress={() => Linking.openURL(`tel:${displayDriver.phone}`)}
              style={styles.callButton}
            />
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Suivi de la commande</Text>
        <View style={styles.timeline}>
          {STEPS.map((step, index) => {
            const timestamp = data?.timeline?.[step.key];
            const done = !!timestamp;
            const isLast = index === STEPS.length - 1;
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineIndicator}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: done ? colors.primary : colors.border },
                    ]}
                  />
                  {!isLast && (
                    <View
                      style={[styles.timelineLine, { backgroundColor: done ? colors.primary : colors.border }]}
                    />
                  )}
                </View>
                <View style={styles.timelineTextWrap}>
                  <Text style={[styles.timelineLabel, { color: done ? colors.foreground : colors.mutedForeground }]}>
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mapWrap: { height: 280, position: 'relative' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  sheet: { flex: 1, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetContent: { padding: 20, gap: 18 },
  etaRow: { alignItems: 'center', gap: 4 },
  etaLabel: { fontSize: 12.5, fontFamily: 'Inter_500Medium' },
  etaValue: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, borderWidth: 1, padding: 14,
  },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  driverRating: { fontSize: 12.5, fontFamily: 'Inter_400Regular', marginTop: 2 },
  callButton: { padding: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineIndicator: { alignItems: 'center', width: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, minHeight: 24 },
  timelineTextWrap: { paddingBottom: 20, paddingTop: -2 },
  timelineLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
