import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.muted,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: active ? '#ffffff' : colors.mutedForeground },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
