import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useColors } from '@/hooks/useColors';

interface TrackingMapProps {
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  driver?: { latitude: number; longitude: number } | null;
  address?: { latitude: number; longitude: number } | null;
}

/** Native map (iOS/Android) with driver + delivery markers. Web uses TrackingMap.web.tsx instead. */
export function TrackingMap({ region, driver, address }: TrackingMapProps) {
  const colors = useColors();

  return (
    <MapView style={StyleSheet.absoluteFill} region={region}>
      {driver && (
        <Marker coordinate={{ latitude: driver.latitude, longitude: driver.longitude }} title="Livreur">
          <View style={[styles.markerDriver, { backgroundColor: colors.primary }]}>
            <Feather name="navigation" size={14} color="#ffffff" />
          </View>
        </Marker>
      )}
      {address && (
        <Marker coordinate={{ latitude: address.latitude, longitude: address.longitude }} title="Livraison">
          <View style={[styles.markerAddress, { backgroundColor: colors.secondary }]}>
            <Feather name="map-pin" size={14} color="#ffffff" />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerDriver: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerAddress: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
