import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
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

// Reverse geocode via expo-location
async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const r = results[0];
    if (!r) throw new Error('no result');
    const street = [r.streetNumber, r.street].filter(Boolean).join(' ') || r.name || 'Position actuelle';
    const city = r.city || r.subregion || r.region || 'Abidjan';
    return { address: street, city };
  } catch {
    return { address: 'Position GPS', city: 'Abidjan' };
  }
}

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const { isAuthenticated } = useAuth();
  const { coords, isUsingFallback } = useLocationContext();
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
  // null = aucune, 'gps' = position actuelle
  const [useGpsAddress, setUseGpsAddress] = useState(false);
  const [gpsLabel, setGpsLabel] = useState<{ address: string; city: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: isAuthenticated,
  });

  // Sélectionner l'adresse par défaut au chargement
  useEffect(() => {
    const addresses = addressesQuery.data ?? [];
    if (!selectedAddressId && addresses.length && !useGpsAddress) {
      const preferred = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedAddressId(preferred.id);
    }
  }, [addressesQuery.data, selectedAddressId, useGpsAddress]);

  const savedAddresses = addressesQuery.data ?? [];
  const selectedAddress: Address | undefined = savedAddresses.find((a) => a.id === selectedAddressId);

  // Utiliser la position GPS comme adresse de livraison
  const handleUseGps = async () => {
    setGpsLoading(true);
    setUseGpsAddress(true);
    setSelectedAddressId(null);
    const label = await reverseGeocode(coords.latitude, coords.longitude);
    setGpsLabel(label);
    if (!isAuthenticated) {
      setManualAddress(label.address);
      setManualCity(label.city);
    }
    setGpsLoading(false);
  };

  // Coordonnées effectives pour l'estimation
  const estimateCoords =
    useGpsAddress
      ? coords
      : selectedAddress
        ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
        : coords;

  const estimateQuery = useQuery({
    queryKey: ['delivery-estimate', restaurantId, estimateCoords.latitude, estimateCoords.longitude],
    queryFn: () =>
      fetchDeliveryEstimate(restaurantId as number, estimateCoords.latitude, estimateCoords.longitude),
    enabled: !!restaurantId,
  });

  const deliveryFee = estimateQuery.data?.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;

  const canCheckout = isAuthenticated
    ? useGpsAddress || !!selectedAddress
    : manualAddress.trim().length > 3 && manualCity.trim().length > 1;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (useGpsAddress && gpsLabel) {
      setCheckoutAddress({
        label: 'Ma position actuelle',
        address: gpsLabel.address,
        city: gpsLabel.city,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } else if (selectedAddress) {
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

        {/* Articles */}
        <View style={styles.items}>
          {items.map((item) => (
            <View key={item.dishId} style={[styles.itemRow, { borderColor: colors.border }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>
                  {formatPrice(item.price)}
                </Text>
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
                  <Text style={[styles.stepperValue, { color: colors.foreground }]}>
                    {item.quantity}
                  </Text>
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

        {/* Adresse de livraison */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Adresse de livraison
        </Text>

        {/* Bouton GPS — toujours visible */}
        <Pressable
          onPress={handleUseGps}
          style={[
            styles.gpsBtn,
            {
              backgroundColor: useGpsAddress ? colors.primary + '15' : colors.muted,
              borderColor: useGpsAddress ? colors.primary : colors.border,
            },
          ]}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={[styles.gpsIconWrap, { backgroundColor: useGpsAddress ? colors.primary : colors.accent }]}>
              <Feather name="navigation" size={15} color={useGpsAddress ? '#ffffff' : colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.gpsBtnLabel, { color: useGpsAddress ? colors.primary : colors.foreground }]}>
              {useGpsAddress && gpsLabel ? gpsLabel.address : 'Utiliser ma position actuelle'}
            </Text>
            <Text style={[styles.gpsBtnSub, { color: colors.mutedForeground }]}>
              {useGpsAddress && gpsLabel
                ? gpsLabel.city
                : isUsingFallback
                  ? 'Position par défaut (Abidjan)'
                  : 'GPS activé — position précise'}
            </Text>
          </View>
          {useGpsAddress && (
            <View style={[styles.radioCheck, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={11} color="#ffffff" />
            </View>
          )}
        </Pressable>

        {/* Adresses sauvegardées (utilisateur connecté) */}
        {isAuthenticated ? (
          <View style={styles.addressList}>
            {savedAddresses.map((addr) => {
              const active = !useGpsAddress && selectedAddressId === addr.id;
              return (
                <Pressable
                  key={addr.id}
                  onPress={() => {
                    setUseGpsAddress(false);
                    setSelectedAddressId(addr.id);
                  }}
                  style={[
                    styles.addressCard,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary + '10' : colors.card,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.addrIcon,
                      { backgroundColor: active ? colors.primary : colors.accent },
                    ]}
                  >
                    <Feather
                      name="map-pin"
                      size={14}
                      color={active ? '#ffffff' : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addrLabel, { color: colors.foreground }]}>
                      {addr.label}
                      {addr.is_default && (
                        <Text style={{ color: colors.primary }}> · Défaut</Text>
                      )}
                    </Text>
                    <Text
                      style={[styles.addrText, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {addr.address}, {addr.city}
                    </Text>
                  </View>
                  {active && (
                    <View style={[styles.radioCheck, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={11} color="#ffffff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => router.push('/profile/addresses' as import('expo-router').Href)}
              style={[styles.newAddrBtn, { borderColor: colors.border }]}
            >
              <Feather name="plus" size={15} color={colors.primary} />
              <Text style={[styles.newAddrText, { color: colors.primary }]}>
                Nouvelle adresse
              </Text>
            </Pressable>
          </View>
        ) : (
          // Formulaire pour visiteur non connecté
          <View style={styles.manualForm}>
            <TextInput
              value={manualAddress}
              onChangeText={(t) => { setManualAddress(t); setUseGpsAddress(false); }}
              placeholder="Quartier, rue, description..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.manualInput,
                { backgroundColor: colors.muted, color: colors.foreground },
              ]}
            />
            <TextInput
              value={manualCity}
              onChangeText={(t) => { setManualCity(t); setUseGpsAddress(false); }}
              placeholder="Ville"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.manualInput,
                { backgroundColor: colors.muted, color: colors.foreground },
              ]}
            />
          </View>
        )}

        {/* Récapitulatif financier */}
        <View style={[styles.recap, { borderColor: colors.border }]}>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Sous-total</Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>
              {formatPrice(subtotal)}
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>
              Frais de livraison
            </Text>
            <Text style={[styles.recapValue, { color: colors.foreground }]}>
              {estimateQuery.isLoading ? '...' : formatPrice(deliveryFee)}
            </Text>
          </View>
          {estimateQuery.data?.is_peak_hour && (
            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { color: '#f97316' }]}>
                🔥 Heure de pointe
              </Text>
              <Text style={[styles.recapValue, { color: '#f97316' }]}>inclus</Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.recapRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatPrice(total)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
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

  // Articles
  items: { gap: 10, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 12,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  itemPrice: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 999, paddingHorizontal: 10, gap: 10, paddingVertical: 6,
  },
  stepperIcon: { padding: 2 },
  stepperValue: { fontSize: 13, fontFamily: 'Inter_700Bold', minWidth: 14, textAlign: 'center' },

  // Section titre
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 16, marginBottom: 10 },

  // Bouton GPS
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1.5, padding: 12,
  },
  gpsIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  gpsBtnLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  gpsBtnSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },

  // Adresses sauvegardées
  addressList: { gap: 8 },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1.5, padding: 12,
  },
  addrIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  addrLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  addrText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', marginTop: 2 },
  radioCheck: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  newAddrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, borderStyle: 'dashed',
    padding: 12, justifyContent: 'center',
  },
  newAddrText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Formulaire manuel
  manualForm: { gap: 10 },
  manualInput: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, fontFamily: 'Inter_400Regular',
  },

  // Récap
  recap: { borderTopWidth: 1, marginTop: 20, paddingTop: 14, gap: 10 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between' },
  recapLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  recapValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1 },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },

  // Footer
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
});
