import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLocationContext } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from '@/lib/endpoints';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { CategoryChip } from '@/components/CategoryChip';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { Address } from '@/types';

const LABELS = ['Maison', 'Bureau', 'Autre'];

export default function AddressesScreen() {
  const colors = useColors();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { coords } = useLocationContext();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [label, setLabel] = useState('Maison');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Abidjan');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated]);

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.show('Adresse ajoutée', 'success');
      resetForm();
    },
    onError: (error) => toast.show(getErrorMessage(error, "Impossible d'ajouter l'adresse"), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Omit<Address, 'id'>> }) =>
      updateAddress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.show('Adresse mise à jour', 'success');
      resetForm();
    },
    onError: (error) => toast.show(getErrorMessage(error, "Impossible de modifier l'adresse"), 'error'),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number) => updateAddress(id, { is_default: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.show('Adresse supprimée', 'success');
    },
    onError: (error) => toast.show(getErrorMessage(error, 'Impossible de supprimer'), 'error'),
  });

  if (!isAuthenticated) return null;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setLabel('Maison');
    setAddress('');
    setCity('Abidjan');
    setInstructions('');
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setAddress(addr.address);
    setCity(addr.city);
    setInstructions(addr.instructions ?? '');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!address.trim()) {
      toast.show('Veuillez saisir une adresse', 'error');
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        payload: { label, address, city, instructions: instructions || undefined },
      });
    } else {
      createMutation.mutate({
        label,
        address,
        city,
        latitude: coords.latitude,
        longitude: coords.longitude,
        instructions: instructions || undefined,
        is_default: (addressesQuery.data?.length ?? 0) === 0,
      });
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert('Supprimer cette adresse ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Mes adresses" />
      <ScrollView contentContainerStyle={styles.content}>
        {(addressesQuery.data ?? []).map((addr) => (
          <View key={addr.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
              <Feather name="map-pin" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.foreground }]}>{addr.label}</Text>
                {addr.is_default && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.defaultText, { color: colors.primary }]}>Par défaut</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
                {addr.address}, {addr.city}
              </Text>
              {addr.instructions ? (
                <Text style={[styles.instructionsText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {addr.instructions}
                </Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              {!addr.is_default && (
                <Feather
                  name="star"
                  size={18}
                  color={colors.mutedForeground}
                  onPress={() => defaultMutation.mutate(addr.id)}
                />
              )}
              <Feather name="edit-2" size={18} color={colors.primary} onPress={() => openEdit(addr)} />
              <Feather name="trash-2" size={18} color={colors.destructive} onPress={() => confirmDelete(addr.id)} />
            </View>
          </View>
        ))}

        {!addressesQuery.isLoading && (addressesQuery.data?.length ?? 0) === 0 && !showForm && (
          <EmptyState icon="map-pin" title="Aucune adresse enregistrée" description="Ajoutez une adresse pour accélérer vos commandes." />
        )}

        {showForm ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              {editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </Text>
            <View style={styles.chipsRow}>
              {LABELS.map((l) => (
                <CategoryChip key={l} label={l} active={label === l} onPress={() => setLabel(l)} />
              ))}
            </View>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Adresse (quartier, rue...)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
            />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Ville"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
            />
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Instructions pour le livreur (optionnel)"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
            />
            {!editingId && (
              <Text style={[styles.gpsNote, { color: colors.mutedForeground }]}>
                📍 Votre position actuelle sera utilisée comme repère GPS.
              </Text>
            )}
            <View style={styles.formButtons}>
              <Button label="Annuler" variant="outline" onPress={resetForm} />
              <Button
                label={editingId ? 'Mettre à jour' : 'Enregistrer'}
                onPress={handleSubmit}
                loading={isSaving}
              />
            </View>
          </View>
        ) : (
          <Button label="+ Ajouter une adresse" variant="outline" onPress={() => setShowForm(true)} fullWidth />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 14 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  defaultBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  defaultText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  addressText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', marginTop: 3 },
  instructionsText: { fontSize: 11.5, fontFamily: 'Inter_400Regular', marginTop: 2, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 14 },
  form: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12, marginTop: 4 },
  formTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  chipsRow: { flexDirection: 'row', gap: 8 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: 'Inter_400Regular' },
  gpsNote: { fontSize: 11.5, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  formButtons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
});
