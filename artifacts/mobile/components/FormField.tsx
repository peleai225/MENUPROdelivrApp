import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export function FormField({ label, error, rightElement, style, ...rest }: FormFieldProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.muted,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }, style]}
          {...rest}
        />
        {rightElement}
      </View>
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 14,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
