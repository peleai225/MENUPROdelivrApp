import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cancelOrder, fetchOrderHistory } from '@/lib/endpoints';
import { getErrorMessage } from '@/lib/api';
import { formatOrderDate, formatPrice } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { Order } from '@/types';

const TRACKABLE_STATUSES = ['pending', 'pending_payment', 'confirmed', 'preparing', 'ready', 'delivering'];
const CANCELLABLE_STATUSES = ['pending', 'pending_payment', 'confirmed'];

export default function OrdersScreen() {
  const colors = useColors();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-history'] });
      setPage(1);
      setAllOrders([]);
      toast.show('Commande annulée', 'success');
    },
    onError: (error) => toast.show(getErrorMessage(error, "Impossible d'annuler la commande"), 'error'),
  });

  const handleCancel = (order: Order) => {
    Alert.alert(
      'Annuler la commande',
      `Voulez-vous vraiment annuler la commande #${order.reference} ?`,
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive', onPress: () => cancelMutation.mutate(order.id) },
      ],
    );
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated]);

  const query = useQuery({
    queryKey: ['orders-history', page],
    queryFn: () => fetchOrderHistory(page),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      setAllOrders((prev) => (page === 1 ? query.data.data : [...prev, ...query.data.data]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    setAllOrders([]);
    queryClient.invalidateQueries({ queryKey: ['orders-history'] });
  }, [queryClient]);

  if (!isAuthenticated) return null;

  const isRefreshing = query.isFetching && page === 1;
  const hasMore = query.data
    ? query.data.current_page < query.data.last_page
    : false;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Mes commandes" />
      <FlatList
        data={allOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.reference, { color: colors.foreground }]}>#{item.reference}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={[styles.itemsSummary, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatOrderDate(item.created_at)}</Text>
              <Text style={[styles.total, { color: colors.foreground }]}>{formatPrice(item.total)}</Text>
            </View>
            {TRACKABLE_STATUSES.includes(item.status) && (
              <Button
                label="Suivre la commande"
                variant="outline"
                onPress={() => router.push(`/orders/track/${item.tracking_token}` as import('expo-router').Href)}
              />
            )}
            {CANCELLABLE_STATUSES.includes(item.status) && (
              <Button
                label="Annuler la commande"
                variant="destructive"
                onPress={() => handleCancel(item)}
                loading={cancelMutation.isPending && cancelMutation.variables === item.id}
              />
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          query.isLoading ? (
            <View style={styles.skeletonWrap}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.muted }]} />
              ))}
            </View>
          ) : (
            <EmptyState icon="clock" title="Aucune commande" description="Votre historique de commandes apparaîtra ici." />
          )
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.loadMoreWrap}>
              <Button label="Charger plus" variant="outline" onPress={() => setPage((p) => p + 1)} loading={query.isFetching} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { padding: 16, flexGrow: 1 },
  skeletonWrap: { gap: 12 },
  skeletonCard: { borderRadius: 18, height: 110 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  itemsSummary: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  total: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  loadMoreWrap: { marginTop: 8, marginBottom: 20 },
});
