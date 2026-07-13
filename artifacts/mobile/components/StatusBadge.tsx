import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getOrderStatusMeta } from '@/lib/format';

export function StatusBadge({ status }: { status: string }) {
  const meta = getOrderStatusMeta(status);
  return (
    <View style={[styles.badge, { backgroundColor: meta.softColor }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
