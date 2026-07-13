import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

/** Custom in-screen header for stack screens with headerShown:false. */
export function ScreenHeader({
  title,
  transparent,
  rightElement,
  onBack,
}: {
  title?: string;
  transparent?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topInset + 10,
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomColor: transparent ? 'transparent' : colors.border,
          borderBottomWidth: transparent ? 0 : 1,
        },
      ]}
    >
      <Pressable
        onPress={() => (onBack ? onBack() : router.back())}
        hitSlop={10}
        style={[
          styles.backButton,
          { backgroundColor: transparent ? 'rgba(15,23,42,0.45)' : colors.muted },
        ]}
      >
        <Feather name="chevron-left" size={20} color={transparent ? '#ffffff' : colors.foreground} />
      </Pressable>
      {title ? (
        <Text style={[styles.title, { color: transparent ? '#ffffff' : colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {rightElement ?? <View style={styles.backButton} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
