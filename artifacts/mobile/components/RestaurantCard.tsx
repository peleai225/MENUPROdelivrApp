import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { formatDistance, formatMinutes, formatPrice } from '@/lib/format';
import type { Restaurant } from '@/types';

export function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.93 : 1 },
      ]}
    >
      {/* Bannière */}
      <View style={styles.bannerWrap}>
        {restaurant.banner_url ? (
          <Image source={{ uri: restaurant.banner_url }} style={styles.banner} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.banner, styles.bannerFallback, { backgroundColor: colors.accent }]}>
            <Feather name="shopping-bag" size={28} color={colors.primary} />
          </View>
        )}

        {/* Badge statut ouvert/fermé */}
        <View style={[styles.statusBadge, { backgroundColor: restaurant.is_open ? '#16a34a' : '#64748b' }]}>
          <View style={styles.statusDotWhite} />
          <Text style={styles.statusBadgeText}>{restaurant.is_open ? 'Ouvert' : 'Fermé'}</Text>
        </View>

        {/* Badge populaire (restaurants ouverts uniquement) */}
        {restaurant.is_open && restaurant.distance_km != null && restaurant.distance_km < 2 && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={10} color="#fff" />
            <Text style={styles.featuredText}>Proche</Text>
          </View>
        )}
      </View>

      {/* Infos restaurant */}
      <View style={styles.info}>
        <View style={styles.logoNameRow}>
          {restaurant.logo_url ? (
            <Image
              source={{ uri: restaurant.logo_url }}
              style={[styles.logo, { borderColor: colors.background }]}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.logo, styles.logoFallback, { backgroundColor: colors.accent, borderColor: colors.background }]}>
              <Feather name="shopping-bag" size={16} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <Text style={[styles.category, { color: colors.mutedForeground }]} numberOfLines={1}>
              {restaurant.category}
              {restaurant.distance_km != null ? ` · ${formatDistance(restaurant.distance_km)}` : ''}
            </Text>
          </View>
        </View>

        {/* Chips méta-données */}
        <View style={styles.metaRow}>
          <MetaChip icon="clock" text={formatMinutes(restaurant.avg_prep_time)} colors={colors} />
          {restaurant.delivery_fee != null && (
            <MetaChip icon="truck" text={formatPrice(restaurant.delivery_fee)} colors={colors} accent />
          )}
          {restaurant.min_order_amount > 0 && (
            <MetaChip icon="shopping-bag" text={`Min. ${formatPrice(restaurant.min_order_amount)}`} colors={colors} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function MetaChip({
  icon, text, colors, accent,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  colors: ReturnType<typeof useColors>;
  accent?: boolean;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: accent ? colors.primary + '15' : colors.muted }]}>
      <Feather name={icon} size={11} color={accent ? colors.primary : colors.mutedForeground} />
      <Text style={[styles.chipText, { color: accent ? colors.primary : colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bannerWrap: { height: 130, position: 'relative' },
  banner: { width: '100%', height: '100%' },
  bannerFallback: { alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  statusDotWhite: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffffffcc' },
  statusBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#ffffff' },
  featuredBadge: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  featuredText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#ffffff' },
  info: { padding: 12, gap: 10 },
  logoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 42, height: 42, borderRadius: 12, borderWidth: 2 },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  category: { fontSize: 12.5, fontFamily: 'Inter_400Regular', marginTop: 1 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
