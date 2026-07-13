import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useColors } from '@/hooks/useColors';
import { formatDistance, formatPrice } from '@/lib/format';
import type { Restaurant } from '@/types';

interface Props {
  restaurants: Restaurant[];
  userCoords: { latitude: number; longitude: number };
  onSelectRestaurant: (r: Restaurant) => void;
}

export function RestaurantMapView({ restaurants, userCoords, onSelectRestaurant }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<Restaurant | null>(null);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.09,
          longitudeDelta: 0.09,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {restaurants.map((r) => {
          const lat = Number(r.latitude);
          const lng = Number(r.longitude);
          if (!lat || !lng) return null;
          const isSelected = selected?.id === r.id;
          return (
            <Marker
              key={r.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => setSelected(r)}
            >
              <View
                style={[
                  styles.pin,
                  { backgroundColor: r.is_open ? colors.primary : '#64748b' },
                  isSelected && styles.pinSelected,
                ]}
              >
                <Text style={styles.pinEmoji}>🍽</Text>
                {isSelected && (
                  <Text style={styles.pinLabel} numberOfLines={1}>
                    {r.name}
                  </Text>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selected && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {selected.banner_url ? (
            <Image source={{ uri: selected.banner_url }} style={styles.cardBanner} contentFit="cover" />
          ) : (
            <View style={[styles.cardBanner, { backgroundColor: colors.accent }]}>
              <Feather name="shopping-bag" size={20} color={colors.primary} />
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                  {selected.name}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: selected.is_open ? colors.success : '#64748b' },
                  ]}
                />
              </View>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                {selected.category}
                {selected.distance_km != null ? ` · ${formatDistance(selected.distance_km)}` : ''}
                {selected.delivery_fee != null ? ` · ${formatPrice(selected.delivery_fee)}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setSelected(null);
                onSelectRestaurant(selected);
              }}
              style={({ pressed }) => [
                styles.goBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </Pressable>
          </View>
          <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 160,
  },
  pinSelected: {
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  pinEmoji: { fontSize: 14 },
  pinLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#ffffff', flexShrink: 1 },
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBanner: { width: '100%', height: 90, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  cardName: { fontSize: 14, fontFamily: 'Inter_700Bold', flexShrink: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  cardMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  goBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 8, right: 8, padding: 4 },
});
