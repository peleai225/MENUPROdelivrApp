import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useCartStore, useCartSubtotal } from '@/context/CartContext';
import { useCheckoutStore } from '@/lib/checkoutStore';
import { useToast } from '@/context/ToastContext';
import { createOrder } from '@/lib/endpoints';
import { getErrorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { PaymentMethod } from '@/types';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; sublabel: string; icon: string; color: string }[] = [
  {
    id: 'wave',
    label: 'Wave',
    sublabel: 'Paiement mobile sécurisé',
    icon: '📲',
    color: '#1BC5FD',
  },
  {
    id: 'cash',
    label: 'Paiement à la livraison',
    sublabel: 'En espèces au livreur',
    icon: '💵',
    color: '#16a34a',
  },
];

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');

  const deliveryFee = estimate?.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;

  const handlePay = async () => {
    if (!restaurantId || !address) return;
    if (items.length === 0) {
      toast.show('Votre panier est vide.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      // L'API n'accepte que 'wave' dans l'enum pour l'instant.
      // Pour 'cash', on crée la commande avec wave puis on saute le paiement.
      const apiPaymentMethod = paymentMethod === 'cash' ? 'wave' : paymentMethod;

      const response = await createOrder({
        restaurant_id: restaurantId,
        items: items.map((item) => ({ dish_id: item.dishId, quantity: item.quantity })),
        delivery_lat: address.latitude,
        delivery_lng: address.longitude,
        delivery_address: address.address,
        delivery_city: address.city,
        delivery_instructions: address.instructions,
        payment_method: apiPaymentMethod as 'wave',
      });

      const { order, payment_url, tracking_token: trackingToken } = response;

      clearCart();
      resetCheckout();

      if (paymentMethod === 'wave') {
        await WebBrowser.openBrowserAsync(payment_url).catch(() => {});
        router.replace(`/payment-result?orderId=${order.id}&token=${trackingToken}`);
      } else {
        // Cash : on saute Wave, on va directement au suivi
        toast.show('Commande confirmée ! Payez à la livraison.', 'success');
        router.replace(`/orders/track/${trackingToken}` as import('expo-router').Href);
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Impossible de créer la commande. Réessayez.');
      toast.show(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Paiement" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Récap articles */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{restaurantName}</Text>
          {items.map((item) => (
            <View key={item.dishId} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.mutedForeground }]}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Adresse livraison */}
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

        {/* Choix du mode de paiement */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mode de paiement</Text>
          <View style={styles.paymentOptions}>
            {PAYMENT_OPTIONS.map((opt) => {
              const active = paymentMethod === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setPaymentMethod(opt.id)}
                  style={[
                    styles.paymentOption,
                    {
                      borderColor: active ? opt.color : colors.border,
                      backgroundColor: active ? opt.color + '12' : colors.muted,
                    },
                  ]}
                >
                  <Text style={styles.paymentEmoji}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paymentLabel, { color: active ? opt.color : colors.foreground }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.paymentSublabel, { color: colors.mutedForeground }]}>
                      {opt.sublabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: active ? opt.color : colors.border },
                    ]}
                  >
                    {active && <View style={[styles.radioInner, { backgroundColor: opt.color }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {paymentMethod === 'cash' && (
            <View style={[styles.cashNotice, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Feather name="info" size={14} color="#16a34a" />
              <Text style={[styles.cashNoticeText, { color: '#15803d' }]}>
                Préparez l'appoint : le livreur ne peut pas toujours rendre la monnaie.
              </Text>
            </View>
          )}
        </View>

        {/* Récapitulatif financier */}
        <View style={[styles.recap, { borderColor: colors.border }]}>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Sous-total</Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Frais de livraison</Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>{formatPrice(deliveryFee)}</Text>
          </View>
          {estimate?.is_peak_hour && (
            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { color: '#f97316' }]}>
                🔥 Majoration heure de pointe
              </Text>
              <Text style={[styles.recapValue, { color: '#f97316' }]}>
                +{formatPrice(estimate.breakdown.peak_surcharge)}
              </Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.recapRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          label={
            paymentMethod === 'wave'
              ? `Payer avec Wave · ${formatPrice(total)}`
              : `Confirmer la commande · ${formatPrice(total)}`
          }
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
  paymentOptions: { gap: 10 },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1.5, padding: 12,
  },
  paymentEmoji: { fontSize: 22 },
  paymentLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  paymentSublabel: { fontSize: 11.5, fontFamily: 'Inter_400Regular', marginTop: 1 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  cashNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 10,
  },
  cashNoticeText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 17 },
  recap: { borderTopWidth: 1, paddingTop: 14, gap: 10 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  recapLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  recapValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
});
