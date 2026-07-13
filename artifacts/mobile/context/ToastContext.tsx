import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const iconName = toast?.type === 'success' ? 'checkmark-circle' : toast?.type === 'error' ? 'alert-circle' : 'information-circle';
  const tint = toast?.type === 'success' ? colors.success : toast?.type === 'error' ? colors.destructive : colors.secondary;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOutUp.duration(180)}
          style={[styles.container, { top: insets.top + 12 }]}
          pointerEvents="none"
        >
          <View style={[styles.toast, { backgroundColor: tint }]}>
            <Ionicons name={iconName} size={18} color="#ffffff" />
            <Text style={styles.text} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
});
