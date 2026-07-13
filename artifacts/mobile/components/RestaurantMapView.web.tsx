import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Restaurant } from '@/types';

interface Props {
  restaurants: Restaurant[];
  userCoords: { latitude: number; longitude: number };
  onSelectRestaurant: (r: Restaurant) => void;
}

/** react-native-maps has no web support. */
export function RestaurantMapView(_props: Props) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.muted }]}>
      <Feather name="map" size={28} color={colors.mutedForeground} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Carte disponible sur l'application mobile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
