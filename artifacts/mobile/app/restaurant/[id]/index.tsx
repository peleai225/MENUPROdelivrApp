import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLocationContext } from '@/context/LocationContext';
import { fetchDeliveryEstimate, fetchRestaurant } from '@/lib/endpoints';
import { formatDistance, formatMinutes, formatPrice } from '@/lib/format';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { coords } = useLocationContext();

  const restaurantQuery = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => fetchRestaurant(id as string),
    enabled: !!id,
  });

  const estimateQuery = useQuery({
    queryKey: ['delivery-estimate', id, coords.latitude, coords.longitude],
    queryFn: () => fetchDeliveryEstimate(id as string, coords.latitude, coords.longitude),
    enabled: !!id,
  });

  const restaurant = restaurantQuery.data;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.banner}>
          {restaurant?.banner_url ? (
            <Image source={{ uri: restaurant.banner_url }} style={styles.bannerImage} contentFit="cover" />
          ) : (
            <View style={[styles.bannerImage, { backgroundColor: colors.accent }]} />
          )}
          <View style={styles.headerOverlay}>
            <ScreenHeader transparent />
          </View>
        </View>

        {restaurant && (
          <View style={styles.content}>
            <View style={styles.logoRow}>
              {restaurant.logo_url ? (
                <Image source={{ uri: restaurant.logo_url }} style={[styles.logo, { borderColor: colors.background }]} />
              ) : (
                <View style={[styles.logo, { backgroundColor: colors.accent, borderColor: colors.background }]} />
              )}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: restaurant.is_open ? '#e9f8ee' : colors.muted },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: restaurant.is_open ? colors.success : colors.mutedForeground }]}
                />
                <Text style={[styles.statusText, { color: restaurant.is_open ? colors.success : colors.mutedForeground }]}>
                  {restaurant.is_open ? 'Ouvert' : 'Fermé'}
                </Text>
              </View>
            </View>

            <Text style={[styles.name, { color: colors.foreground }]}>{restaurant.name}</Text>
            <Text style={[styles.category, { color: colors.mutedForeground }]}>
              {restaurant.category} · {restaurant.address}
            </Text>

            <View style={styles.statsRow}>
              <Stat
                icon="clock"
                label={formatMinutes(estimateQuery.data?.estimated_minutes ?? restaurant.avg_prep_time)}
                sub="Livraison"
                colors={colors}
              />
              <Stat
                icon="truck"
                label={estimateQuery.data ? formatPrice(estimateQuery.data.delivery_fee) : '...'}
                sub="Frais"
                colors={colors}
              />
              <Stat
                icon="map-pin"
                label={formatDistance(estimateQuery.data?.distance_km ?? restaurant.distance_km)}
                sub="Distance"
                colors={colors}
              />
            </View>

            {!restaurant.is_open && (
              <View style={[styles.noticeBox, { backgroundColor: colors.muted }]}>
                <Feather name="info" size={15} color={colors.mutedForeground} />
                <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                  Ce restaurant est actuellement fermé. Vous pouvez consulter le menu, mais la commande n'est pas
                  possible pour le moment.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {restaurant && (
        <View style={[styles.footer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Button
            label="Voir le menu"
            onPress={() => router.push(`/restaurant/${restaurant.id}/menu`)}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

function Stat({
  icon,
  label,
  sub,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.muted }]}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[styles.statLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  banner: { height: 200, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: 16, marginTop: -30 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  logo: { width: 72, height: 72, borderRadius: 18, borderWidth: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  name: { fontSize: 21, fontFamily: 'Inter_700Bold', marginTop: 12 },
  category: { fontSize: 13.5, fontFamily: 'Inter_400Regular', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  stat: { flex: 1, borderRadius: 16, padding: 12, gap: 4, alignItems: 'flex-start' },
  statLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  noticeBox: { flexDirection: 'row', gap: 8, borderRadius: 14, padding: 12, marginTop: 16, alignItems: 'flex-start' },
  noticeText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
});
