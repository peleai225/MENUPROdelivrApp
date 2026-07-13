import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export const ABIDJAN_FALLBACK = { latitude: 5.3542, longitude: -3.9827 };

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationContextValue {
  coords: Coords;
  isUsingFallback: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coords>(ABIDJAN_FALLBACK);
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? navigator : undefined;
        if (nav?.geolocation) {
          await new Promise<void>((resolve) => {
            nav.geolocation.getCurrentPosition(
              (pos) => {
                setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                setIsUsingFallback(false);
                resolve();
              },
              () => {
                setCoords(ABIDJAN_FALLBACK);
                setIsUsingFallback(true);
                resolve();
              },
              { timeout: 8000 },
            );
          });
        } else {
          setCoords(ABIDJAN_FALLBACK);
          setIsUsingFallback(true);
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({});
          setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setIsUsingFallback(false);
        } else {
          // GPS refusé : fallback silencieux, pas d'erreur affichée.
          setCoords(ABIDJAN_FALLBACK);
          setIsUsingFallback(true);
        }
      }
    } catch {
      setCoords(ABIDJAN_FALLBACK);
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ coords, isUsingFallback, isLoading, refresh }),
    [coords, isUsingFallback, isLoading],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}
