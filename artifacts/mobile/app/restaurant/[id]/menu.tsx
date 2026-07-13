import React, { useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { fetchMenu, fetchRestaurant } from '@/lib/endpoints';
import { addToCartWithConfirm, useCartItemCount, useCartSubtotal, useCartStore, useDishQuantity } from '@/context/CartContext';
import { DishCard } from '@/components/DishCard';
import { CartFAB } from '@/components/CartFAB';
import { CategoryChip } from '@/components/CategoryChip';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import type { Dish } from '@/types';

export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<number, number>>({});
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const itemCount = useCartItemCount();
  const subtotal = useCartSubtotal();

  const restaurantQuery = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => fetchRestaurant(id as string),
    enabled: !!id,
  });

  const menuQuery = useQuery({
    queryKey: ['menu', id],
    queryFn: () => fetchMenu(id as string),
    enabled: !!id,
  });

  const categories = menuQuery.data?.categories ?? [];
  const restaurant = restaurantQuery.data;

  const scrollToCategory = (categoryId: number) => {
    setActiveCategory(categoryId);
    const y = sectionOffsets.current[categoryId];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: y - 8, animated: true });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title={restaurant?.name ?? 'Menu'} />

      {categories.length > 0 && (
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.tabsRow}
          style={[styles.tabsList, { borderColor: colors.border }]}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.name}
              active={activeCategory === item.id || (activeCategory === null && categories[0]?.id === item.id)}
              onPress={() => scrollToCategory(item.id)}
            />
          )}
        />
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        {categories.length === 0 && !menuQuery.isLoading && (
          <EmptyState icon="frown" title="Menu indisponible" description="Ce restaurant n'a pas encore publié son menu." />
        )}
        {categories.map((category) => (
          <View
            key={category.id}
            onLayout={(e) => {
              sectionOffsets.current[category.id] = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{category.name}</Text>
            <View style={styles.dishList}>
              {category.dishes.map((dish: Dish) => (
                <DishRow
                  key={dish.id}
                  dish={dish}
                  restaurantId={Number(id)}
                  restaurantName={restaurant?.name ?? ''}
                  updateQuantity={updateQuantity}
                />
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: itemCount > 0 ? 90 : 20 }} />
      </ScrollView>

      <CartFAB itemCount={itemCount} subtotal={subtotal} onPress={() => router.push('/cart')} />
    </View>
  );
}

function DishRow({
  dish,
  restaurantId,
  restaurantName,
  updateQuantity,
}: {
  dish: Dish;
  restaurantId: number;
  restaurantName: string;
  updateQuantity: (dishId: number, quantity: number) => void;
}) {
  const quantity = useDishQuantity(dish.id);

  return (
    <DishCard
      dish={dish}
      quantity={quantity}
      onAdd={() =>
        addToCartWithConfirm(restaurantId, restaurantName, {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          imageUrl: dish.image_url,
        })
      }
      onIncrement={() => updateQuantity(dish.id, quantity + 1)}
      onDecrement={() => updateQuantity(dish.id, quantity - 1)}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabsList: { borderBottomWidth: 1, flexGrow: 0 },
  tabsRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  dishList: { gap: 10 },
});
