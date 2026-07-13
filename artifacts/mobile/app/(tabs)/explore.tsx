import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLocationContext } from '@/context/LocationContext';
import { fetchRestaurants } from '@/lib/endpoints';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantListSkeleton } from '@/components/RestaurantCardSkeleton';
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
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingTop: topInset + 12 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Explorer</Text>

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
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Ouvert maintenant</Text>
              <Switch
                value={openNow}
                onValueChange={setOpenNow}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        }
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  chipsRow: { gap: 8, paddingRight: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  toggleLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
