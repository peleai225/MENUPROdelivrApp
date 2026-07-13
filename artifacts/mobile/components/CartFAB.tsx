import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { formatPrice } from '@/lib/format';

export function CartFAB({
  itemCount,
  subtotal,
  onPress,
}: {
  itemCount: number;
  subtotal: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (itemCount === 0) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 16 }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={styles.left}>
          <Feather name="shopping-bag" size={18} color="#ffffff" />
          <Text style={styles.text}>
            Voir le panier · {itemCount} article{itemCount > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.price}>{formatPrice(subtotal)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  price: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
