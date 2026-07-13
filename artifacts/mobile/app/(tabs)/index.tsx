import React, { useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLocationContext } from '@/context/LocationContext';
import { fetchNearbyRestaurants, fetchRestaurants } from '@/lib/endpoints';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantListSkeleton } from '@/components/RestaurantCardSkeleton';
import { CategoryChip } from '@/components/CategoryChip';
import { EmptyState } from '@/components/EmptyState';
import type { Restaurant } from '@/types';

const CATEGORIES = ['Tous', 'Fast Food', 'Restaurant', 'Pizza', 'Poulet', 'Grillades', 'Café'];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const { customer } = useAuth();
  const { coords, isUsingFallback } = useLocationContext();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');

  const nearbyQuery = useQuery({
    queryKey: ['restaurants-nearby', coords.latitude, coords.longitude],
    queryFn: () => fetchNearbyRestaurants({ lat: coords.latitude, lng: coords.longitude, radius_km: 15 }),
  });

  const allQuery = useQuery({
    queryKey: ['restaurants-all'],
    queryFn: () => fetchRestaurants(),
  });

  const restaurants: Restaurant[] = useMemo(() => {
    const nearby = nearbyQuery.data ?? [];
    const all = allQuery.data ?? [];
    const seen = new Set(nearby.map((r) => r.id));
    return [...nearby, ...all.filter((r) => !seen.has(r.id))];
  }, [nearbyQuery.data, allQuery.data]);

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesCategory = category === 'Tous' || r.category?.toLowerCase().includes(category.toLowerCase());
      const matchesSearch = !search.trim() || r.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [restaurants, category, search]);

  const isLoading = nearbyQuery.isLoading && allQuery.isLoading;
  const firstName = customer?.name?.split(' ')[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingTop: topInset + 12 }]}
        refreshControl={
          <RefreshControl
            refreshing={nearbyQuery.isRefetching || allQuery.isRefetching}
            onRefresh={() => {
              nearbyQuery.refetch();
              allQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <View>
                <Text style={[styles.greeting, { color: colors.foreground }]}>
                  {firstName ? `Bonjour, ${firstName} 👋` : 'Bonjour 👋'}
                </Text>
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                    {isUsingFallback ? 'Abidjan (position par défaut)' : 'Autour de vous'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un restaurant..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
              />
            </View>

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

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Restaurants près de vous</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          isLoading ? (
            <RestaurantListSkeleton />
          ) : (
            <EmptyState
              icon="frown"
              title="Aucun restaurant trouvé"
              description="Essayez une autre recherche ou catégorie."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { gap: 16, marginBottom: 16 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  chipsRow: { gap: 8, paddingRight: 8 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
});
