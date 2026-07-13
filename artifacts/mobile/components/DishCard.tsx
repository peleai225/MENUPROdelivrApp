import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { formatPrice } from '@/lib/format';
import type { Dish } from '@/types';

interface DishCardProps {
  dish: Dish;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function DishCard({ dish, quantity, onAdd, onIncrement, onDecrement }: DishCardProps) {
  const colors = useColors();
  const disabled = !dish.is_available;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.55 : 1 },
      ]}
    >
      {dish.image_url ? (
        <Image source={{ uri: dish.image_url }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, styles.imageFallback, { backgroundColor: colors.muted }]}>
          <Feather name="image" size={20} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {dish.name}
        </Text>
        {dish.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}
        <View style={styles.bottomRow}>
          <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(dish.price)}</Text>
          {disabled ? (
            <Text style={[styles.unavailable, { color: colors.mutedForeground }]}>Indisponible</Text>
          ) : quantity > 0 ? (
            <View style={[styles.stepper, { backgroundColor: colors.primary }]}>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onDecrement();
                }}
                style={styles.stepperButton}
              >
                <Feather name="minus" size={15} color="#ffffff" />
              </Pressable>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onIncrement();
                }}
                style={styles.stepperButton}
              >
                <Feather name="plus" size={15} color="#ffffff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onAdd();
              }}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="plus" size={16} color="#ffffff" />
            </Pressable>
          )}
        </View>
      </View>
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
  image: {
    width: 76,
    height: 76,
    borderRadius: 14,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  description: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  unavailable: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 4,
    gap: 8,
  },
  stepperButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    minWidth: 14,
    textAlign: 'center',
  },
});
