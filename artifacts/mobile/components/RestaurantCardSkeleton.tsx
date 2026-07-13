import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

function Shimmer({ style }: { style: object }) {
  const colors = useColors();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[style, animatedStyle, { backgroundColor: colors.muted }]} />;
}

export function RestaurantCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Shimmer style={styles.logo} />
      <View style={styles.info}>
        <Shimmer style={styles.lineWide} />
        <Shimmer style={styles.lineNarrow} />
        <Shimmer style={styles.lineTiny} />
      </View>
    </View>
  );
}

export function RestaurantListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  lineWide: {
    height: 14,
    borderRadius: 7,
    width: '70%',
  },
  lineNarrow: {
    height: 11,
    borderRadius: 6,
    width: '50%',
  },
  lineTiny: {
    height: 11,
    borderRadius: 6,
    width: '35%',
  },
});
