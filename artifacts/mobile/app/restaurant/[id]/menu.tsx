import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { fetchMenu, fetchRestaurant } from '@/lib/endpoints';
import {
  addToCartWithConfirm,
  useCartItemCount,
  useCartSubtotal,
  useCartStore,
  useDishQuantity,
} from '@/context/CartContext';
import { CartFAB } from '@/components/CartFAB';
import { EmptyState } from '@/components/EmptyState';
import { formatMinutes, formatPrice } from '@/lib/format';
import type { Dish, MenuCategory } from '@/types';

const HERO_HEIGHT = 220;

// ─── Skeleton ───────────────────────────────────────────────────────────────

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function Shimmer({ style }: { style: object }) {
  const colors = useColors();
  const op = useSharedValue(0.45);
  useEffect(() => {
    op.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.View style={[style, anim, { backgroundColor: colors.muted }]} />;
}

function MenuSkeleton() {
  return (
    <View style={{ padding: 16, gap: 24 }}>
      {[0, 1].map((s) => (
        <View key={s} style={{ gap: 12 }}>
          <Shimmer style={{ height: 16, width: 120, borderRadius: 8 }} />
          {[0, 1, 2].map((d) => (
            <View key={d} style={{ flexDirection: 'row', gap: 12 }}>
              <Shimmer style={{ width: 80, height: 80, borderRadius: 14 }} />
              <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
                <Shimmer style={{ height: 14, width: '70%', borderRadius: 7 }} />
                <Shimmer style={{ height: 11, width: '90%', borderRadius: 6 }} />
                <Shimmer style={{ height: 11, width: '40%', borderRadius: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── DishCard inline ─────────────────────────────────────────────────────────

function DishItem({
  dish,
  restaurantId,
  restaurantName,
  updateQuantity,
}: {
  dish: Dish;
  restaurantId: number;
  restaurantName: string;
  updateQuantity: (id: number, qty: number) => void;
}) {
  const colors = useColors();
  const quantity = useDishQuantity(dish.id);
  const disabled = !dish.is_available;
  const hasDiscount = dish.compare_price != null && dish.compare_price > dish.price;
  const discountPct = hasDiscount
    ? Math.round((1 - dish.price / dish.compare_price!) * 100)
    : 0;

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addToCartWithConfirm(restaurantId, restaurantName, {
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      imageUrl: dish.image_url,
    });
  };

  return (
    <View
      style={[
        styles.dishCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.55 : 1 },
      ]}
    >
      {/* Image */}
      <View style={styles.dishImageWrap}>
        {dish.image_url ? (
          <Image
            source={{ uri: dish.image_url }}
            style={styles.dishImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.dishImage, styles.dishImageFallback, { backgroundColor: colors.accent }]}>
            <Feather name="image" size={20} color={colors.mutedForeground} />
          </View>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
        {dish.is_featured && !hasDiscount && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary + 'ee' }]}>
            <Text style={styles.featuredText}>⭐ Coup de cœur</Text>
          </View>
        )}
      </View>

      {/* Infos */}
      <View style={styles.dishInfo}>
        {/* Tags */}
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

        <Text style={[styles.dishName, { color: colors.foreground }]} numberOfLines={2}>
          {dish.name}
        </Text>

        {dish.description ? (
          <Text style={[styles.dishDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}

        {dish.prep_time > 0 && (
          <View style={styles.prepRow}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.prepText, { color: colors.mutedForeground }]}>
              {formatMinutes(dish.prep_time)}
            </Text>
          </View>
        )}

        {/* Prix + action */}
        <View style={styles.dishBottom}>
          <View>
            <Text style={[styles.dishPrice, { color: colors.primary }]}>
              {formatPrice(dish.price)}
            </Text>
            {hasDiscount && (
              <Text style={[styles.comparePrice, { color: colors.mutedForeground }]}>
                {formatPrice(dish.compare_price!)}
              </Text>
            )}
          </View>

          {disabled ? (
            <View style={[styles.unavailableChip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.unavailableText, { color: colors.mutedForeground }]}>
                Indisponible
              </Text>
            </View>
          ) : quantity > 0 ? (
            <View style={[styles.stepper, { backgroundColor: colors.primary }]}>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  updateQuantity(dish.id, quantity - 1);
                }}
                style={styles.stepperBtn}
              >
                <Feather name="minus" size={15} color="#fff" />
              </Pressable>
              <Text style={styles.stepperVal}>{quantity}</Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  updateQuantity(dish.id, quantity + 1);
                }}
                style={styles.stepperBtn}
              >
                <Feather name="plus" size={15} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="plus" size={17} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Tab pill ────────────────────────────────────────────────────────────────

function TabPill({
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
      style={[
        styles.tabPill,
        {
          backgroundColor: active ? colors.primary : colors.muted,
          borderColor: active ? colors.primary : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.tabPillText,
          { color: active ? '#ffffff' : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const tabsRef = useRef<FlatList>(null);
  const sectionOffsets = useRef<Record<number, number>>({});
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const isManualScroll = useRef(false);

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

  const categories: MenuCategory[] = menuQuery.data?.categories ?? [];
  const restaurant = restaurantQuery.data;

  // Scroll to section when tab tapped
  const scrollToCategory = useCallback(
    (categoryId: number, index: number) => {
      isManualScroll.current = true;
      setActiveCategory(categoryId);
      tabsRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      const y = sectionOffsets.current[categoryId];
      if (y != null) {
        // offset: hero is collapsed after first scroll, add tabs height (~52)
        const offset = heroVisible ? HERO_HEIGHT + 52 : 52;
        scrollRef.current?.scrollTo({ y: y - offset + 12, animated: true });
      }
      setTimeout(() => {
        isManualScroll.current = false;
      }, 600);
    },
    [heroVisible],
  );

  // Update active tab while scrolling
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      setHeroVisible(y < HERO_HEIGHT - 60);

      if (isManualScroll.current || categories.length === 0) return;

      // Find which section is currently in view
      let current = categories[0]?.id ?? null;
      for (const cat of categories) {
        const offset = sectionOffsets.current[cat.id];
        if (offset != null && y >= offset - 80) current = cat.id;
      }
      if (current !== activeCategory) setActiveCategory(current);
    },
    [categories, activeCategory],
  );

  const activeIndex = categories.findIndex((c) => c.id === (activeCategory ?? categories[0]?.id));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Hero banner avec gradient + bouton retour */}
      <View style={[styles.hero, { height: heroVisible ? HERO_HEIGHT : 0, overflow: 'hidden' }]}>
        {restaurant?.banner_url ? (
          <Image
            source={{ uri: restaurant.banner_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.accent }]} />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.6)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Back + titre restaurant */}
        <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.heroBack, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
          >
            <Feather name="arrow-left" size={20} color="#ffffff" />
          </Pressable>
        </View>
        <View style={styles.heroBottom}>
          <View style={styles.heroMeta}>
            {restaurant?.logo_url && (
              <Image
                source={{ uri: restaurant.logo_url }}
                style={[styles.heroLogo, { borderColor: colors.background }]}
                contentFit="cover"
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName} numberOfLines={1}>
                {restaurant?.name ?? ''}
              </Text>
              <View style={styles.heroMetaRow}>
                <Feather name="clock" size={11} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>
                  {formatMinutes(restaurant?.avg_prep_time)} · {restaurant?.category}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Header compact quand hero masqué */}
      {!heroVisible && (
        <View
          style={[
            styles.compactHeader,
            { paddingTop: insets.top + 4, backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.compactBack}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.compactTitle, { color: colors.foreground }]} numberOfLines={1}>
            {restaurant?.name ?? 'Menu'}
          </Text>
          <View style={{ width: 36 }} />
        </View>
      )}

      {/* Tabs catégories sticky */}
      {categories.length > 1 && (
        <View style={[styles.tabsWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <FlatList
            ref={tabsRef}
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.tabsRow}
            getItemLayout={(_, index) => ({ length: 110, offset: 110 * index, index })}
            renderItem={({ item, index }) => (
              <TabPill
                label={item.name}
                active={
                  activeCategory === item.id ||
                  (activeCategory === null && categories[0]?.id === item.id)
                }
                onPress={() => scrollToCategory(item.id, index)}
              />
            )}
          />
        </View>
      )}

      {/* Corps du menu */}
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: itemCount > 0 ? 110 : 32 },
        ]}
      >
        {menuQuery.isLoading && <MenuSkeleton />}

        {!menuQuery.isLoading && categories.length === 0 && (
          <EmptyState
            icon="frown"
            title="Menu indisponible"
            description="Ce restaurant n'a pas encore publié son menu."
          />
        )}

        {categories.map((cat) => (
          <View
            key={cat.id}
            onLayout={(e) => {
              sectionOffsets.current[cat.id] = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            {/* En-tête de section */}
            <View style={[styles.sectionHeader, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {cat.name}
              </Text>
              <View style={[styles.sectionCount, { backgroundColor: colors.muted }]}>
                <Text style={[styles.sectionCountText, { color: colors.mutedForeground }]}>
                  {cat.dishes.length}
                </Text>
              </View>
            </View>

            {/* Plats */}
            <View style={styles.dishList}>
              {cat.dishes.map((dish: Dish) => (
                <DishItem
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
      </ScrollView>

      <CartFAB itemCount={itemCount} subtotal={subtotal} onPress={() => router.push('/cart')} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Hero
  hero: { position: 'relative', justifyContent: 'space-between' },
  heroTop: { paddingHorizontal: 16, paddingBottom: 8 },
  heroBack: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBottom: { paddingHorizontal: 16, paddingBottom: 16 },
  heroMeta: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  heroLogo: { width: 50, height: 50, borderRadius: 14, borderWidth: 2 },
  heroName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  heroMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)' },

  // Compact header
  compactHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1,
  },
  compactBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  compactTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },

  // Tabs
  tabsWrap: { borderBottomWidth: 1 },
  tabsRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  tabPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1.5,
  },
  tabPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Sections
  scrollContent: { paddingTop: 8 },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  sectionCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  sectionCountText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  dishList: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },

  // Dish card
  dishCard: {
    flexDirection: 'row', gap: 12,
    borderRadius: 18, borderWidth: 1, padding: 12,
  },
  dishImageWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  dishImage: { width: 90, height: 90 },
  dishImageFallback: { alignItems: 'center', justifyContent: 'center' },
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
  dishInfo: { flex: 1, gap: 3 },
  tagsRow: { flexDirection: 'row', gap: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  tagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  dishName: { fontSize: 14.5, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  dishDesc: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  prepRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  prepText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  dishBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 6,
  },
  dishPrice: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  comparePrice: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  unavailableChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  unavailableText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 999, paddingHorizontal: 4, gap: 8,
  },
  stepperBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepperVal: {
    color: '#ffffff', fontSize: 13, fontFamily: 'Inter_700Bold',
    minWidth: 14, textAlign: 'center',
  },
});
