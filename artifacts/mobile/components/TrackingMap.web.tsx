import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface TrackingMapProps {
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  driver?: { latitude: number; longitude: number } | null;
  address?: { latitude: number; longitude: number } | null;
}

/** react-native-maps has no web support; show a lightweight placeholder instead. */
export function TrackingMap(_props: TrackingMapProps) {
  const colors = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: colors.muted }]}>
      <Feather name="map" size={28} color={colors.mutedForeground} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Carte disponible sur l'application mobile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { fontSize: 12.5, fontFamily: 'Inter_500Medium' },
});
