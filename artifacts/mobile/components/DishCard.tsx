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
  const hasDiscount = dish.compare_price != null && dish.compare_price > dish.price;
  const discountPct = hasDiscount
    ? Math.round((1 - dish.price / dish.compare_price!) * 100)
    : 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.55 : 1 },
      ]}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {dish.image_url ? (
          <Image source={{ uri: dish.image_url }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.imageFallback, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={20} color={colors.mutedForeground} />
          </View>
        )}
        {/* Badge promo — coin haut gauche dans l'image */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
        {/* Badge featured — bandeau bas dans l'image */}
        {dish.is_featured && !hasDiscount && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary + 'ee' }]}>
            <Text style={styles.featuredText}>⭐ Coup de cœur</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        {/* Tags (épicé, végétarien) */}
        {(dish.is_spicy || dish.is_vegetarian) && (
          <View style={styles.tagsRow}>
            {dish.is_spicy && (
              <View style={[styles.tag, { backgroundColor: '#fef2f2' }]}>
                <Text style={[styles.tagText, { color: '#dc2626' }]}>🌶 Épicé</Text>
              </View>
            )}
            {dish.is_vegetarian && (
              <View style={[styles.tag, { backgroundColor: '#f0fdf4' }]}>
                <Text style={[styles.tagText, { color: '#16a34a' }]}>🌿 Végé</Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {dish.name}
        </Text>

        {dish.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}

        {dish.prep_time > 0 && (
          <View style={styles.prepRow}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.prepText, { color: colors.mutedForeground }]}>{dish.prep_time} min</Text>
          </View>
        )}

        <View style={styles.bottomRow}>
          <View>
            <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(dish.price)}</Text>
            {hasDiscount && (
              <Text style={[styles.comparePrice, { color: colors.mutedForeground }]}>
                {formatPrice(dish.compare_price!)}
              </Text>
            )}
          </View>

          {disabled ? (
            <View style={[styles.unavailableBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.unavailable, { color: colors.mutedForeground }]}>Indisponible</Text>
            </View>
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
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 20, borderWidth: 1 },
  imageWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  image: { width: 80, height: 80 },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  discountBadge: {
    position: 'absolute', top: 5, left: 5,
    backgroundColor: '#dc2626', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  discountText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  featuredBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 3, alignItems: 'center',
  },
  featuredText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#ffffff' },
  info: { flex: 1, gap: 3 },
  tagsRow: { flexDirection: 'row', gap: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  tagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  description: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  prepRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  prepText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  comparePrice: { fontSize: 11, fontFamily: 'Inter_400Regular', textDecorationLine: 'line-through' },
  unavailableBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  unavailable: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  addButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 4, gap: 8 },
  stepperButton: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { color: '#ffffff', fontSize: 13, fontFamily: 'Inter_700Bold', minWidth: 14, textAlign: 'center' },
});
