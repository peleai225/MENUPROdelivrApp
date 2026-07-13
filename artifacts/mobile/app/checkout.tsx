import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useCartStore, useCartSubtotal } from '@/context/CartContext';
import { useCheckoutStore } from '@/lib/checkoutStore';
import { useToast } from '@/context/ToastContext';
import { createOrder, initiatePayment } from '@/lib/endpoints';
import { getErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const items = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const clearCart = useCartStore((state) => state.clear);
  const subtotal = useCartSubtotal();
  const address = useCheckoutStore((state) => state.address);
  const estimate = useCheckoutStore((state) => state.estimate);
  const resetCheckout = useCheckoutStore((state) => state.reset);
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = estimate?.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;

  const handlePay = async () => {
    if (!restaurantId || !address) return;
    setIsProcessing(true);
    try {
      const { order } = await createOrder({
        restaurant_id: restaurantId,
        items: items.map((item) => ({ dish_id: item.dishId, quantity: item.quantity })),
        delivery_lat: address.latitude,
        delivery_lng: address.longitude,
        delivery_address: address.address,
        delivery_city: address.city,
        delivery_instructions: address.instructions,
        payment_method: 'wave',
      });

      const { payment_url } = await initiatePayment(order.id);
      const trackingToken = order.tracking_token;

      clearCart();
      resetCheckout();

      await WebBrowser.openBrowserAsync(payment_url).catch(() => {});

      toast.show('Suivez votre commande en direct', 'success');
      router.replace(`/track/${trackingToken}`);
    } catch (error) {
      toast.show(getErrorMessage(error, 'Impossible de créer la commande'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Paiement" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{restaurantName}</Text>
          {items.map((item) => (
            <View key={item.dishId} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.mutedForeground }]}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Adresse de livraison</Text>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressLabel, { color: colors.foreground }]}>{address?.label}</Text>
              <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
                {address?.address}, {address?.city}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Paiement</Text>
          <View style={[styles.waveRow, { backgroundColor: colors.accent }]}>
            <View style={[styles.waveIcon, { backgroundColor: '#1BC5FD' }]}>
              <Feather name="credit-card" size={16} color="#ffffff" />
            </View>
            <Text style={[styles.waveText, { color: colors.foreground }]}>Wave — paiement mobile sécurisé</Text>
          </View>
        </View>

        <View style={[styles.recap, { borderColor: colors.border }]}>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Sous-total</Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Frais de livraison</Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>{formatPrice(deliveryFee)}</Text>
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
          label={`Payer avec Wave · ${formatPrice(total)}`}
          onPress={handlePay}
          loading={isProcessing}
          disabled={!restaurantId || !address || items.length === 0}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 13, fontFamily: 'Inter_400Regular', flexShrink: 1 },
  itemPrice: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  addressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  addressLabel: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
  addressText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', marginTop: 2 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12 },
  waveIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  waveText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  recap: { borderTopWidth: 1, paddingTop: 14, gap: 10 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  recapLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  recapValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
});
