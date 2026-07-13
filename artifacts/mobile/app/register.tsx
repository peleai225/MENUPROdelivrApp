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
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/api';
import { isPhoneCI } from '@/lib/format';
import { sendPhoneOTP, toE164CI, verifyPhoneOTP, type FirebaseConfirmation } from '@/lib/firebase';
import { registerWithFirebasePhone, registerClient } from '@/lib/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '@/lib/api';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { ScreenHeader } from '@/components/ScreenHeader';

type Step = 'phone' | 'otp' | 'profile';

const OTP_LENGTH = 6;

export default function RegisterScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [confirmation, setConfirmation] = useState<FirebaseConfirmation | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [firebaseIdToken, setFirebaseIdToken] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [profileErrors, setProfileErrors] = useState<{ name?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Étape 1 : envoi OTP ────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!isPhoneCI(phone)) {
      setPhoneError('Numéro invalide (ex : 0712345678)');
      return;
    }
    setPhoneError('');
    setLoading(true);
    try {
      const e164 = toE164CI(phone);
      const conf = await sendPhoneOTP(e164);
      setConfirmation(conf);
      setStep('otp');
      startCountdown(60);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Impossible d\'envoyer le code.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds: number) => {
    setResendCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  // ── Étape 2 : vérification OTP ────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otpCode.length !== OTP_LENGTH) {
      setOtpError('Entrez le code à 6 chiffres reçu par SMS.');
      return;
    }
    if (!confirmation) { setOtpError('Session expirée. Recommencez.'); return; }
    setOtpError('');
    setLoading(true);
    try {
      const { idToken } = await verifyPhoneOTP(confirmation, otpCode);
      setFirebaseIdToken(idToken);
      setStep('profile');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Code incorrect.');
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 3 : création du compte ─────────────────────────────────────────
  const handleCreateAccount = async () => {
    const errs: { name?: string; password?: string } = {};
    if (name.trim().length < 2) errs.name = 'Veuillez entrer votre nom complet.';
    if (password.length < 8) errs.password = 'Au moins 8 caractères.';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileErrors({});
    setLoading(true);
    try {
      // Try with Firebase token first; if backend doesn't support it, fall back to plain register
      let data;
      try {
        data = await registerWithFirebasePhone({
          firebase_id_token: firebaseIdToken,
          phone,
          name: name.trim(),
          password,
        });
      } catch {
        // Backend doesn't have firebase-phone endpoint yet — fallback to standard register
        data = await registerClient({ name: name.trim(), phone, password });
      }
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      // Use login context to hydrate customer state
      await login({ phone, password }).catch(() => {
        // If auto-login fails (e.g. wrong pwd edge case), just navigate home
      });
      toast.show('Compte créé avec succès !', 'success');
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (error) {
      toast.show(getErrorMessage(error, 'Impossible de créer le compte.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Rendu étape 1 : saisie téléphone ─────────────────────────────────────
  const renderPhoneStep = () => (
    <View style={styles.stepWrap}>
      <View style={[styles.stepIcon, { backgroundColor: colors.primary + '18' }]}>
        <Feather name="smartphone" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        Votre numéro
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Nous vous enverrons un code SMS de vérification.
      </Text>

      <View style={styles.phoneInputWrap}>
        <View style={[styles.countryTag, { backgroundColor: colors.muted }]}>
          <Text style={[styles.countryText, { color: colors.foreground }]}>🇨🇮 +225</Text>
        </View>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="07 XX XX XX XX"
          keyboardType="phone-pad"
          style={[
            styles.phoneInput,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: phoneError ? colors.destructive : colors.border,
            },
          ]}
          placeholderTextColor={colors.mutedForeground}
          maxLength={10}
        />
      </View>
      {phoneError ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{phoneError}</Text>
      ) : null}

      <Button
        label="Envoyer le code SMS"
        onPress={handleSendOTP}
        loading={loading}
        fullWidth
      />
    </View>
  );

  // ── Rendu étape 2 : saisie OTP ────────────────────────────────────────────
  const renderOTPStep = () => (
    <View style={styles.stepWrap}>
      <View style={[styles.stepIcon, { backgroundColor: '#fef3e0' }]}>
        <Feather name="message-square" size={28} color="#f97316" />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>Code SMS</Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Code envoyé au{' '}
        <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{phone}</Text>
        {'\n'}Vérifiez vos SMS.
      </Text>

      {/* Champ OTP */}
      <TextInput
        value={otpCode}
        onChangeText={(t) => {
          setOtpCode(t.replace(/\D/g, '').slice(0, OTP_LENGTH));
          if (otpError) setOtpError('');
        }}
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
        label="Vérifier le code"
        onPress={handleVerifyOTP}
        loading={loading}
        disabled={otpCode.length !== OTP_LENGTH}
        fullWidth
      />

      {/* Renvoi */}
      <Pressable
        onPress={resendCountdown === 0 ? handleSendOTP : undefined}
        style={styles.resendRow}
      >
        <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
          Vous n'avez pas reçu le code ?{' '}
        </Text>
        <Text
          style={[
            styles.resendLink,
            { color: resendCountdown > 0 ? colors.mutedForeground : colors.primary },
          ]}
        >
          {resendCountdown > 0 ? `Renvoyer (${resendCountdown}s)` : 'Renvoyer'}
        </Text>
      </Pressable>

      <Pressable onPress={() => setStep('phone')} style={styles.backRow}>
        <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
        <Text style={[styles.backText, { color: colors.mutedForeground }]}>
          Changer de numéro
        </Text>
      </Pressable>
    </View>
  );

  // ── Rendu étape 3 : profil ────────────────────────────────────────────────
  const renderProfileStep = () => (
    <View style={styles.stepWrap}>
      <View style={[styles.stepIcon, { backgroundColor: '#e9f8ee' }]}>
        <Feather name="check-circle" size={28} color="#16a34a" />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        Numéro vérifié !
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Finalisez votre compte en quelques secondes.
      </Text>

      <View style={styles.form}>
        <FormField
          label="Nom complet"
          placeholder="Votre nom"
          value={name}
          onChangeText={setName}
          error={profileErrors.name}
        />
        <FormField
          label="Mot de passe"
          placeholder="Au moins 8 caractères"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={profileErrors.password}
        />
        <Button
          label="Créer mon compte"
          onPress={handleCreateAccount}
          loading={loading}
          fullWidth
        />
      </View>
    </View>
  );

  // ── Indicateur d'étapes ───────────────────────────────────────────────────
  const STEPS: Step[] = ['phone', 'otp', 'profile'];
  const currentIdx = STEPS.indexOf(step);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Stepper */}
        <View style={styles.stepper}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: i <= currentIdx ? colors.primary : colors.border,
                    width: i === currentIdx ? 28 : 20,
                    height: i === currentIdx ? 28 : 20,
                    borderRadius: i === currentIdx ? 14 : 10,
                  },
                ]}
              >
                {i < currentIdx ? (
                  <Feather name="check" size={12} color="#ffffff" />
                ) : (
                  <Text style={styles.stepDotNum}>{i + 1}</Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: i < currentIdx ? colors.primary : colors.border },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {step === 'phone' && renderPhoneStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'profile' && renderProfileStep()}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Déjà un compte ?
          </Text>
          <Text
            style={[styles.footerLink, { color: colors.primary }]}
            onPress={() => router.replace('/login')}
          >
            {' '}Se connecter
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, alignItems: 'center',
  },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  stepDot: {
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotNum: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  stepLine: { flex: 1, height: 2, marginHorizontal: 6 },

  // Step content
  stepWrap: { width: '100%', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  stepTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  stepSubtitle: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    textAlign: 'center', lineHeight: 20, marginBottom: 8,
  },

  // Phone input
  phoneInputWrap: { flexDirection: 'row', gap: 8, width: '100%' },
  countryTag: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    borderRadius: 14, height: 52,
  },
  countryText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  phoneInput: {
    flex: 1, borderRadius: 14, paddingHorizontal: 14,
    fontSize: 16, fontFamily: 'Inter_500Medium', height: 52,
    borderWidth: 1.5,
  },

  // OTP
  otpInput: {
    width: '100%', borderRadius: 16, height: 60,
    fontSize: 28, fontFamily: 'Inter_700Bold',
    letterSpacing: 12, borderWidth: 1.5,
  },
  resendRow: { flexDirection: 'row', marginTop: 4 },
  resendText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  resendLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  backText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // Profile
  form: { width: '100%', gap: 14 },
  errorText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', alignSelf: 'flex-start' },

  // Footer
  footer: { flexDirection: 'row', marginTop: 28 },
  footerText: { fontSize: 13.5, fontFamily: 'Inter_400Regular' },
  footerLink: { fontSize: 13.5, fontFamily: 'Inter_600SemiBold' },
});
