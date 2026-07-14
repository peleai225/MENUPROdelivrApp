import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { fetchPaymentStatus } from '@/lib/endpoints';
import { Button } from '@/components/Button';

const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

export default function PaymentResultScreen() {
  const { orderId, token } = useLocalSearchParams<{ orderId: string; token: string }>();
  const colors = useColors();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const pollCount = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const poll = async () => {
      try {
        const result = await fetchPaymentStatus(Number(orderId));
        setPaymentStatus(result.payment_status);
        setOrderStatus(result.order_status);

        if (result.payment_status === 'paid' || result.payment_status === 'failed') return;

        pollCount.current += 1;
        if (pollCount.current < MAX_POLLS) {
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    poll();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [orderId]);

  const isPaid = paymentStatus === 'paid';
  const isFailed = paymentStatus === 'failed' || error;
  const isPending = !isPaid && !isFailed;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        {isPending && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.title, { color: colors.foreground }]}>Vérification du paiement…</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Ne fermez pas cette page. Nous confirmons votre paiement Wave.
            </Text>
          </>
        )}

        {isPaid && (
          <>
            <View style={[styles.iconWrap, { backgroundColor: colors.successSoft }]}>
              <Feather name="check-circle" size={48} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Paiement confirmé !</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Votre commande a été transmise au restaurant. Suivez-la en temps réel.
            </Text>
            <View style={styles.actions}>
              {token ? (
                <Button
                  label="Suivre ma commande"
                  onPress={() => router.replace(`/orders/track/${token}` as import('expo-router').Href)}
                  fullWidth
                />
              ) : (
                <Button
                  label="Voir mes commandes"
                  onPress={() => router.replace('/orders')}
                  fullWidth
                />
              )}
            </View>
          </>
        )}

        {isFailed && (
          <>
            <View style={[styles.iconWrap, { backgroundColor: '#fdeaea' }]}>
              <Feather name="x-circle" size={48} color={colors.destructive} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Paiement non confirmé</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Nous n'avons pas pu confirmer votre paiement. Vérifiez vos commandes ou réessayez.
            </Text>
            <View style={styles.actions}>
              <Button label="Voir mes commandes" onPress={() => router.replace('/orders')} fullWidth />
              <Button
                label="Retour à l'accueil"
                variant="outline"
                onPress={() => router.replace('/')}
                fullWidth
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  actions: { width: '100%', gap: 10, marginTop: 8 },
});
