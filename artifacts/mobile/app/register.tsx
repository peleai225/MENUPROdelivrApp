import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  name: z.string().min(2, 'Veuillez entrer votre nom'),
  phone: z.string().refine(isPhoneCI, {
    message: 'Numéro invalide (doit commencer par 01, 05 ou 07 et contenir 10 chiffres)',
  }),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const colors = useColors();
  const { register } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await register(values);
      toast.show('Compte créé avec succès', 'success');
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (error) {
      toast.show(getErrorMessage(error, 'Impossible de créer le compte'), 'error');
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
        <Text style={[styles.title, { color: colors.foreground }]}>Créer un compte</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Rejoignez MenuPro Delivery pour commander vos plats préférés.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <FormField
                label="Nom complet"
                placeholder="Votre nom"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
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
                placeholder="Au moins 8 caractères"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Button label="Créer mon compte" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Déjà un compte ?</Text>
          <Text style={[styles.footerLink, { color: colors.primary }]} onPress={() => router.push('/login')}>
            {' '}Se connecter
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 },
  form: { width: '100%', gap: 16 },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 13.5, fontFamily: 'Inter_400Regular' },
  footerLink: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
});
