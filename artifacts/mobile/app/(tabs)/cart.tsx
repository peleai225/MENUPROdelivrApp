import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLocationContext } from '@/context/LocationContext';
import { useCartItemCount, useCartStore, useCartSubtotal } from '@/context/CartContext';
import { useCheckoutStore } from '@/lib/checkoutStore';
import { fetchAddresses, fetchDeliveryEstimate } from '@/lib/endpoints';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import type { Address } from '@/types';

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const { isAuthenticated } = useAuth();
  const { coords } = useLocationContext();
  const items = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const subtotal = useCartSubtotal();
  const itemCount = useCartItemCount();
  const setCheckoutAddress = useCheckoutStore((state) => state.setAddress);
  const setCheckoutEstimate = useCheckoutStore((state) => state.setEstimate);

  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('Abidjan');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const addresses = addressesQuery.data ?? [];
    if (!selectedAddressId && addresses.length) {
      const preferred = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedAddressId(preferred.id);
    }
  }, [addressesQuery.data, selectedAddressId]);

  const selectedAddress: Address | undefined = addressesQuery.data?.find((a) => a.id === selectedAddressId);

  const estimateCoords = selectedAddress
    ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
    : coords;

  const estimateQuery = useQuery({
    queryKey: ['delivery-estimate', restaurantId, estimateCoords.latitude, estimateCoords.longitude],
    queryFn: () => fetchDeliveryEstimate(restaurantId as number, estimateCoords.latitude, estimateCoords.longitude),
    enabled: !!restaurantId,
  });

  const deliveryFee = estimateQuery.data?.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;

  const canCheckout = isAuthenticated
    ? !!selectedAddress
    : manualAddress.trim().length > 3 && manualCity.trim().length > 1;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (selectedAddress) {
      setCheckoutAddress({
        label: selectedAddress.label,
        address: selectedAddress.address,
        city: selectedAddress.city,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        instructions: selectedAddress.instructions ?? undefined,
      });
    } else {
      setCheckoutAddress({
        label: 'Adresse de livraison',
        address: manualAddress,
        city: manualCity,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }
    setCheckoutEstimate(estimateQuery.data ?? null);
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <Text style={[styles.title, { color: colors.foreground, paddingHorizontal: 16 }]}>Panier</Text>
        <EmptyState
          icon="shopping-bag"
          title="Votre panier est vide"
          description="Parcourez les restaurants et ajoutez vos plats préférés."
          actionLabel="Explorer les restaurants"
          onAction={() => router.push('/explore')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Panier</Text>
        <Text style={[styles.restaurantName, { color: colors.mutedForeground }]}>{restaurantName}</Text>

        <View style={styles.items}>
          {items.map((item) => (
            <View key={item.dishId} style={[styles.itemRow, { borderColor: colors.border }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
              </View>
              <View style={styles.itemActions}>
                <View style={[styles.stepper, { backgroundColor: colors.muted }]}>
                  <Feather
                    name="minus"
                    size={15}
                    color={colors.foreground}
                    onPress={() => updateQuantity(item.dishId, item.quantity - 1)}
                    style={styles.stepperIcon}
                  />
                  <Text style={[styles.stepperValue, { color: colors.foreground }]}>{item.quantity}</Text>
                  <Feather
                    name="plus"
                    size={15}
                    color={colors.foreground}
                    onPress={() => updateQuantity(item.dishId, item.quantity + 1)}
                    style={styles.stepperIcon}
                  />
                </View>
                <Feather
                  name="trash-2"
                  size={17}
                  color={colors.destructive}
                  onPress={() => removeItem(item.dishId)}
                />
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Adresse de livraison</Text>
        {isAuthenticated ? (
          <View style={styles.addressList}>
            {(addressesQuery.data ?? []).map((addr) => (
              <View
                key={addr.id}
                style={[
                  styles.addressCard,
                  {
                    borderColor: selectedAddressId === addr.id ? colors.primary : colors.border,
                    backgroundColor: selectedAddressId === addr.id ? colors.accent : colors.card,
                  },
                ]}
              >
                <Feather
                  name="map-pin"
                  size={16}
                  color={colors.primary}
                  onPress={() => setSelectedAddressId(addr.id)}
                />
                <View style={{ flex: 1 }} onTouchEnd={() => setSelectedAddressId(addr.id)}>
                  <Text style={[styles.addressLabel, { color: colors.foreground }]}>{addr.label}</Text>
                  <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {addr.address}, {addr.city}
                  </Text>
                </View>
              </View>
            ))}
            <Button label="+ Nouvelle adresse" variant="outline" onPress={() => router.push('/addresses')} />
          </View>
        ) : (
          <View style={styles.manualForm}>
            <TextInput
              value={manualAddress}
              onChangeText={setManualAddress}
              placeholder="Adresse (quartier, rue...)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.manualInput, { backgroundColor: colors.muted, color: colors.foreground }]}
            />
            <TextInput
              value={manualCity}
              onChangeText={setManualCity}
              placeholder="Ville"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.manualInput, { backgroundColor: colors.muted, color: colors.foreground }]}
            />
          </View>
        )}

        <View style={[styles.recap, { borderColor: colors.border }]}>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Sous-total</Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Frais de livraison</Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>
              {estimateQuery.isLoading ? '...' : formatPrice(deliveryFee)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.recapRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          label={isAuthenticated ? 'Commander' : 'Se connecter pour commander'}
          onPress={handleCheckout}
          disabled={!canCheckout}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  restaurantName: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 2, marginBottom: 8 },
  items: { gap: 10, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  itemPrice: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, gap: 10, paddingVertical: 6 },
  stepperIcon: { padding: 2 },
  stepperValue: { fontSize: 13, fontFamily: 'Inter_700Bold', minWidth: 14, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 16, marginBottom: 10 },
  addressList: { gap: 10 },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 12 },
  addressLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  addressText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', marginTop: 2 },
  manualForm: { gap: 10 },
  manualInput: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: 'Inter_400Regular' },
  recap: { borderTopWidth: 1, marginTop: 20, paddingTop: 14, gap: 10 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  recapLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  recapValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
});
