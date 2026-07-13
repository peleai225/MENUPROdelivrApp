import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, TOKEN_KEY } from '@/lib/api';
import { isPhoneCI } from '@/lib/format';
import { sendPhoneOTP, toE164CI, verifyPhoneOTP, type FirebaseConfirmation } from '@/lib/firebase';
import { loginWithFirebasePhone } from '@/lib/endpoints';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ScreenHeader } from '@/components/ScreenHeader';

type LoginMode = 'password' | 'otp';

const schema = z.object({
  phone: z.string().refine(isPhoneCI, {
    message: 'Numéro invalide (ex : 0712345678)',
  }),
  password: z.string().min(8, 'Au moins 8 caractères'),
});
type FormValues = z.infer<typeof schema>;

const OTP_LENGTH = 6;

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<LoginMode>('password');

  // ── Mode mot de passe ─────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmitPassword = async (values: FormValues) => {
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

  // ── Mode OTP SMS ──────────────────────────────────────────────────────────
  const [otpPhone, setOtpPhone] = useState('');
  const [otpPhoneError, setOtpPhoneError] = useState('');
  const [confirmation, setConfirmation] = useState<FirebaseConfirmation | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = (secs: number) => {
    setResendCountdown(secs);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) { clearInterval(countdownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!isPhoneCI(otpPhone)) {
      setOtpPhoneError('Numéro invalide (ex : 0712345678)');
      return;
    }
    setOtpPhoneError('');
    setOtpLoading(true);
    try {
      const conf = await sendPhoneOTP(toE164CI(otpPhone));
      setConfirmation(conf);
      setOtpStep('code');
      startCountdown(60);
    } catch (err) {
      setOtpPhoneError(err instanceof Error ? err.message : 'Impossible d\'envoyer le code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== OTP_LENGTH) {
      setOtpError('Entrez le code à 6 chiffres.');
      return;
    }
    if (!confirmation) { setOtpError('Session expirée. Recommencez.'); return; }
    setOtpError('');
    setOtpLoading(true);
    try {
      const { idToken } = await verifyPhoneOTP(confirmation, otpCode);
      // Tenter connexion via Firebase token
      try {
        const data = await loginWithFirebasePhone({ firebase_id_token: idToken, phone: otpPhone });
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
        await login({ phone: otpPhone, password: '' }).catch(() => {});
        toast.show('Connexion réussie', 'success');
        if (router.canGoBack()) router.back();
        else router.replace('/');
      } catch {
        // Endpoint firebase-phone non supporté côté API → informer l'utilisateur
        toast.show(
          'Compte non trouvé pour ce numéro. Créez un compte d\'abord.',
          'error',
        );
        router.push('/register');
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Code incorrect.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBack = () => {
    setOtpStep('phone');
    setOtpCode('');
    setOtpError('');
  };

  // ── Mode switcher ─────────────────────────────────────────────────────────
  const switchMode = (m: LoginMode) => {
    setMode(m);
    setOtpStep('phone');
    setOtpCode('');
    setOtpError('');
    setOtpPhoneError('');
    setConfirmation(null);
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

        {/* Toggle de mode */}
        <View style={[styles.modeToggle, { backgroundColor: colors.muted }]}>
          <Pressable
            onPress={() => switchMode('password')}
            style={[
              styles.modeBtn,
              mode === 'password' && { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
            ]}
          >
            <Feather name="lock" size={14} color={mode === 'password' ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.modeBtnText, { color: mode === 'password' ? colors.foreground : colors.mutedForeground }]}>
              Mot de passe
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode('otp')}
            style={[
              styles.modeBtn,
              mode === 'otp' && { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
            ]}
          >
            <Feather name="message-square" size={14} color={mode === 'otp' ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.modeBtnText, { color: mode === 'otp' ? colors.foreground : colors.mutedForeground }]}>
              Code SMS
            </Text>
          </Pressable>
        </View>

        {/* ── Formulaire mot de passe ───────────────────────────────────── */}
        {mode === 'password' && (
          <View style={styles.form}>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <FormField
                  label="Numéro de téléphone"
                  placeholder="0712345678"
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
            <Button
              label="Se connecter"
              onPress={handleSubmit(onSubmitPassword)}
              loading={isSubmitting}
              fullWidth
            />
          </View>
        )}

        {/* ── Formulaire OTP ────────────────────────────────────────────── */}
        {mode === 'otp' && otpStep === 'phone' && (
          <View style={styles.form}>
            <Text style={[styles.otpHint, { color: colors.mutedForeground }]}>
              Recevez un code SMS pour vous connecter sans mot de passe.
            </Text>
            <View style={styles.phoneRow}>
              <View style={[styles.countryTag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.countryText, { color: colors.foreground }]}>🇨🇮 +225</Text>
              </View>
              <TextInput
                value={otpPhone}
                onChangeText={(t) => { setOtpPhone(t.replace(/\D/g, '').slice(0, 10)); setOtpPhoneError(''); }}
                placeholder="07 XX XX XX XX"
                keyboardType="phone-pad"
                maxLength={10}
                style={[
                  styles.phoneInput,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderColor: otpPhoneError ? colors.destructive : colors.border,
                  },
                ]}
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            {otpPhoneError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{otpPhoneError}</Text>
            ) : null}
            <Button
              label="Envoyer le code"
              onPress={handleSendOTP}
              loading={otpLoading}
              fullWidth
            />
          </View>
        )}

        {mode === 'otp' && otpStep === 'code' && (
          <View style={styles.form}>
            <Text style={[styles.otpHint, { color: colors.mutedForeground }]}>
              Code envoyé au{' '}
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{otpPhone}</Text>
            </Text>
            <TextInput
              value={otpCode}
              onChangeText={(t) => { setOtpCode(t.replace(/\D/g, '').slice(0, OTP_LENGTH)); setOtpError(''); }}
              placeholder="• • • • • •"
              keyboardType="number-pad"
              textAlign="center"
              maxLength={OTP_LENGTH}
              style={[
                styles.otpInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: otpError ? colors.destructive : colors.border,
                },
              ]}
              placeholderTextColor={colors.mutedForeground}
            />
            {otpError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{otpError}</Text>
            ) : null}
            <Button
              label="Valider"
              onPress={handleVerifyOTP}
              loading={otpLoading}
              disabled={otpCode.length !== OTP_LENGTH}
              fullWidth
            />
            <View style={styles.resendRow}>
              <Pressable onPress={resendCountdown === 0 ? handleSendOTP : undefined}>
                <Text style={[styles.resendText, { color: resendCountdown > 0 ? colors.mutedForeground : colors.primary }]}>
                  {resendCountdown > 0 ? `Renvoyer (${resendCountdown}s)` : 'Renvoyer le code'}
                </Text>
              </Pressable>
              <Text style={{ color: colors.mutedForeground }}> · </Text>
              <Pressable onPress={handleBack}>
                <Text style={[styles.resendText, { color: colors.primary }]}>Changer de numéro</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Pas encore de compte ?</Text>
          <Text
            style={[styles.footerLink, { color: colors.primary }]}
            onPress={() => router.push('/register')}
          >
            {' '}Créer un compte
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, alignItems: 'center', gap: 0 },
  logo: { width: 64, height: 64, borderRadius: 18, marginBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row', borderRadius: 16, padding: 4, width: '100%',
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  modeBtnText: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },

  // Forms
  form: { width: '100%', gap: 14 },
  otpHint: { fontSize: 13.5, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryTag: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    borderRadius: 14, height: 52,
  },
  countryText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  phoneInput: {
    flex: 1, borderRadius: 14, paddingHorizontal: 14,
    fontSize: 16, fontFamily: 'Inter_500Medium', height: 52, borderWidth: 1.5,
  },
  otpInput: {
    width: '100%', borderRadius: 16, height: 60,
    fontSize: 28, fontFamily: 'Inter_700Bold',
    letterSpacing: 12, borderWidth: 1.5,
  },
  errorText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', alignSelf: 'flex-start' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  resendText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  // Footer
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 13.5, fontFamily: 'Inter_400Regular' },
  footerLink: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
});
