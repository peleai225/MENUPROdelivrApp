import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/api';
import { getNotificationPermissionStatus, requestNotificationPermission } from '@/lib/notifications';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const { customer, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [city, setCity] = useState(customer?.city ?? '');
  const [saving, setSaving] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getNotificationPermissionStatus().then(setNotifStatus);
    }, []),
  );

  const handleToggleNotifications = async (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Notifications désactivées',
        'Pour désactiver les notifications, utilisez les réglages de votre téléphone.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        'Autorisation requise',
        'Activez les notifications dans les réglages de votre téléphone pour suivre vos commandes en direct.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
        ],
      );
    }
    setNotifStatus(await getNotificationPermissionStatus());
  };

  React.useEffect(() => {
    setName(customer?.name ?? '');
    setEmail(customer?.email ?? '');
    setCity(customer?.city ?? '');
  }, [customer]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, email: email || undefined, city: city || undefined });
      toast.show('Profil mis à jour', 'success');
    } catch (error) {
      toast.show(getErrorMessage(error, 'Impossible de mettre à jour le profil'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (isLoading) {
    return <View style={[styles.screen, { backgroundColor: colors.background }]} />;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
          <Feather name="user" size={30} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Connectez-vous</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Créez un compte pour suivre vos commandes et enregistrer vos adresses.
        </Text>
        <View style={styles.authActions}>
          <Button label="Se connecter" onPress={() => router.push('/login')} fullWidth />
          <Button label="Créer un compte" variant="outline" onPress={() => router.push('/register')} fullWidth />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 12 }]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Mon profil</Text>

      <View style={[styles.avatarCard, { backgroundColor: colors.accent }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarInitial}>{customer?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View>
          <Text style={[styles.customerName, { color: colors.foreground }]}>{customer?.name}</Text>
          <Text style={[styles.customerPhone, { color: colors.mutedForeground }]}>{customer?.phone}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <FormField label="Nom complet" value={name} onChangeText={setName} placeholder="Votre nom" />
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField label="Ville" value={city} onChangeText={setCity} placeholder="Abidjan" />
        <Button label="Enregistrer" onPress={handleSave} loading={saving} fullWidth />
      </View>

      <View style={[styles.linksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ProfileLink icon="clock" label="Mes commandes" onPress={() => router.push('/orders')} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ProfileLink icon="map-pin" label="Mes adresses" onPress={() => router.push('/profile/addresses' as import('expo-router').Href)} colors={colors} />
      </View>

      <View style={[styles.linksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.notifRow}>
          <View style={styles.linkRowLeft}>
            <View style={[styles.linkIconWrap, { backgroundColor: colors.accent }]}>
              <Feather name="bell" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.linkLabel, { color: colors.foreground }]}>Notifications</Text>
              <Text style={[styles.notifSubtitle, { color: colors.mutedForeground }]}>
                {notifStatus === 'granted' ? 'Activées' : 'Suivi de vos commandes en direct'}
              </Text>
            </View>
          </View>
          <Switch
            value={notifStatus === 'granted'}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </View>

      <Button label="Déconnexion" variant="destructive" onPress={handleLogout} fullWidth />
    </ScrollView>
  );
}

function ProfileLink({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.linkRowLeft}>
        <View style={[styles.linkIconWrap, { backgroundColor: colors.accent }]}>
          <Feather name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.linkLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 20 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  authActions: { width: '100%', gap: 10, marginTop: 24 },
  avatarCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#ffffff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  customerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  customerPhone: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  form: { gap: 14 },
  linksCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  divider: { height: 1 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  notifSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
