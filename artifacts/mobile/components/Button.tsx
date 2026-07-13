import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'md' | 'lg';
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  fullWidth,
  size = 'lg',
  testID,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.secondary
        : variant === 'destructive'
          ? colors.destructive
          : 'transparent';

  const borderColor = variant === 'outline' ? colors.border : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'secondary' || variant === 'destructive'
      ? '#ffffff'
      : variant === 'outline'
        ? colors.foreground
        : colors.primary;

  return (
    <Pressable
      testID={testID}
      disabled={isDisabled}
      onPress={() => {
        if (isDisabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        fullWidth && styles.fullWidth,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  lg: {
    paddingVertical: 15,
    paddingHorizontal: 22,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
