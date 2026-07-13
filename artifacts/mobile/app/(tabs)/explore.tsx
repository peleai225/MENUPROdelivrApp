import React, { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLocationContext } from '@/context/LocationContext';
import { fetchRestaurants } from '@/lib/endpoints';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantListSkeleton } from '@/components/RestaurantCardSkeleton';
import { RestaurantMapView } from '@/components/RestaurantMapView';
import { CategoryChip } from '@/components/CategoryChip';
import { EmptyState } from '@/components/EmptyState';

const CITIES = ['Toutes', 'Abidjan', 'Bouaké', 'Yamoussoukro'];
const CATEGORIES = ['Toutes', 'Fast Food', 'Restaurant', 'Pizza', 'Poulet', 'Grillades', 'Café'];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const { coords } = useLocationContext();
  const [city, setCity] = useState('Toutes');
  const [category, setCategory] = useState('Toutes');
  const [openNow, setOpenNow] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const query = useQuery({
    queryKey: ['restaurants-explore', city, category, openNow, coords.latitude, coords.longitude],
    queryFn: () =>
      fetchRestaurants({
        city: city === 'Toutes' ? undefined : city,
        category: category === 'Toutes' ? undefined : category,
        open_now: openNow || undefined,
        lat: coords.latitude,
        lng: coords.longitude,
      }),
  });

  const sorted = useMemo(() => {
    const list = query.data ?? [];
    return [...list].sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
  }, [query.data]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header fixe avec filtres */}
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Explorer</Text>
          {/* Toggle liste / carte */}
          <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[
                styles.toggleBtn,
                viewMode === 'list' && { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="list" size={16} color={viewMode === 'list' ? '#ffffff' : colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('map')}
              style={[
                styles.toggleBtn,
                viewMode === 'map' && { backgroundColor: colors.primary },
              ]}
            >
              <Feather name="map" size={16} color={viewMode === 'map' ? '#ffffff' : colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={CITIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <CategoryChip label={item} active={city === item} onPress={() => setCity(item)} />
          )}
        />
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <CategoryChip label={item} active={category === item} onPress={() => setCategory(item)} />
          )}
        />

        <View style={[styles.toggleRow, { backgroundColor: colors.muted }]}>
          <View style={styles.toggleRowLeft}>
            <View style={[styles.toggleIcon, { backgroundColor: colors.successSoft }]}>
              <View style={[styles.toggleDot, { backgroundColor: colors.success }]} />
            </View>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Ouvert maintenant</Text>
          </View>
          <Switch
            value={openNow}
            onValueChange={setOpenNow}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Contenu : liste ou carte */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <RestaurantMapView
            restaurants={sorted}
            userCoords={coords}
            onSelectRestaurant={(r) => router.push(`/restaurant/${r.id}`)}
          />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            query.isLoading ? (
              <RestaurantListSkeleton />
            ) : (
              <EmptyState icon="map-pin" title="Aucun restaurant" description="Essayez d'autres filtres." />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 10, zIndex: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  viewToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 2 },
  toggleBtn: { width: 34, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { gap: 8, paddingRight: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  toggleRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  mapContainer: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
});
