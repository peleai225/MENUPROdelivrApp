import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/api';
import { isPhoneCI } from '@/lib/format';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ScreenHeader } from '@/components/ScreenHeader';

const schema = z.object({
  phone: z.string().refine(isPhoneCI, {
    message: 'Numéro invalide (doit commencer par 01, 05 ou 07 et contenir 10 chiffres)',
  }),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await login(values);
      toast.show('Connexion réussie', 'success');
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (error) {
      toast.show(getErrorMessage(error, 'Numéro ou mot de passe incorrect'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="cover" />
        <Text style={[styles.title, { color: colors.foreground }]}>Bon retour !</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Connectez-vous pour commander et suivre vos livraisons.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <FormField
                label="Numéro de téléphone"
                placeholder="0102030405"
                keyboardType="phone-pad"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.phone?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormField
                label="Mot de passe"
                placeholder="••••••••"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Button label="Se connecter" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Pas encore de compte ?</Text>
          <Text style={[styles.footerLink, { color: colors.primary }]} onPress={() => router.push('/register')}>
            {' '}Créer un compte
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, alignItems: 'center' },
  logo: { width: 64, height: 64, borderRadius: 18, marginBottom: 20 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 },
  form: { width: '100%', gap: 16 },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 13.5, fontFamily: 'Inter_400Regular' },
  footerLink: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
});
