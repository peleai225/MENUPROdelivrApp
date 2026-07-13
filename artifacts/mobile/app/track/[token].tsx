import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useCheckoutStore } from '@/lib/checkoutStore';
import { trackOrder } from '@/lib/endpoints';
import { formatMinutes } from '@/lib/format';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TrackingMap } from '@/components/TrackingMap';
import { ABIDJAN_FALLBACK } from '@/context/LocationContext';

const STEPS: { key: 'ordered_at' | 'confirmed_at' | 'preparing_at' | 'driver_assigned_at' | 'picked_up_at' | 'completed_at'; label: string }[] = [
  { key: 'ordered_at', label: 'Commande passée' },
  { key: 'confirmed_at', label: 'Confirmée par le restaurant' },
  { key: 'preparing_at', label: 'En préparation' },
  { key: 'driver_assigned_at', label: 'Livreur assigné' },
  { key: 'picked_up_at', label: 'Récupérée par le livreur' },
  { key: 'completed_at', label: 'Livrée' },
];

export default function TrackScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const colors = useColors();
  const address = useCheckoutStore((state) => state.address);

  const trackingQuery = useQuery({
    queryKey: ['tracking', token],
    queryFn: () => trackOrder(token as string),
    enabled: !!token,
    refetchInterval: 5000,
  });

  const data = trackingQuery.data;
  const driver = data?.delivery?.driver;

  const mapRegion = {
    latitude: driver?.latitude ?? address?.latitude ?? ABIDJAN_FALLBACK.latitude,
    longitude: driver?.longitude ?? address?.longitude ?? ABIDJAN_FALLBACK.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.mapWrap}>
        <TrackingMap region={mapRegion} driver={driver} address={address} />
        <View style={styles.headerOverlay}>
          <ScreenHeader transparent />
        </View>
      </View>

      <ScrollView style={[styles.sheet, { backgroundColor: colors.background }]} contentContainerStyle={styles.sheetContent}>
        <View style={styles.etaRow}>
          <Text style={[styles.etaLabel, { color: colors.mutedForeground }]}>Arrivée estimée</Text>
          <Text style={[styles.etaValue, { color: colors.primary }]}>
            {formatMinutes(data?.estimated_minutes) || '—'}
          </Text>
        </View>

        {driver && (
          <View style={[styles.driverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.driverAvatar, { backgroundColor: colors.accent }]}>
              <Feather name="user" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>{driver.name}</Text>
              <Text style={[styles.driverRating, { color: colors.mutedForeground }]}>★ {driver.rating}</Text>
            </View>
            <Feather
              name="phone-call"
              size={20}
              color={colors.primary}
              onPress={() => Linking.openURL(`tel:${driver.phone}`)}
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
                    <View style={[styles.timelineLine, { backgroundColor: done ? colors.primary : colors.border }]} />
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
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 14 },
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
