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
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={styles.logoWrap}>
        {restaurant.logo_url ? (
          <Image source={{ uri: restaurant.logo_url }} style={styles.logo} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.logo, styles.logoFallback, { backgroundColor: colors.accent }]}>
            <Feather name="shopping-bag" size={22} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.statusDot,
            { backgroundColor: restaurant.is_open ? colors.success : colors.mutedForeground },
          ]}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          {!restaurant.is_open && (
            <View style={[styles.closedBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.closedText, { color: colors.mutedForeground }]}>Fermé</Text>
            </View>
          )}
        </View>
        <Text style={[styles.category, { color: colors.mutedForeground }]} numberOfLines={1}>
          {restaurant.category}
          {restaurant.distance_km != null ? ` · ${formatDistance(restaurant.distance_km)}` : ''}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatMinutes(restaurant.avg_prep_time)}
            </Text>
          </View>
          {restaurant.delivery_fee != null && (
            <View style={styles.metaItem}>
              <Feather name="truck" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatPrice(restaurant.delivery_fee)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  logoWrap: {
    position: 'relative',
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  closedBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  closedText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  category: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
