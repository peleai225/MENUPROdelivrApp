import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/Button';
import { requestNotificationPermission } from '@/lib/notifications';

interface Slide {
  key: string;
  icon?: keyof typeof Feather.glyphMap;
  showLogo?: boolean;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    showLogo: true,
    title: 'Bienvenue sur MenuPro Delivery',
    description: 'Vos plats préférés livrés rapidement, partout en Côte d\u2019Ivoire.',
  },
  {
    key: 'discover',
    icon: 'search',
    title: 'Découvrez des restaurants',
    description: 'Parcourez les meilleurs restaurants et maquis près de chez vous, à Abidjan comme ailleurs.',
  },
  {
    key: 'track',
    icon: 'map-pin',
    title: 'Suivez votre commande en direct',
    description: 'Localisez votre livreur en temps réel et suivez chaque étape jusqu\u2019à votre porte.',
  },
  {
    key: 'notifications',
    icon: 'bell',
    title: 'Restez informé',
    description: 'Activez les notifications pour être alerté dès que votre commande est confirmée, en route ou livrée.',
  },
];

interface OnboardingFlowProps {
  onDone: () => void;
}

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const goToIndex = (next: number) => {
    listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    setIndex(next);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
    onDone();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {!isLast && (
        <View style={styles.skipRow}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]} onPress={onDone}>
            Passer
          </Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {item.showLogo ? (
              <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
                <Feather name={item.icon} size={40} color={colors.primary} />
              </View>
            )}
            <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>{item.description}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.primary : colors.border,
                  width: i === index ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {isLast ? (
          <View style={styles.actions}>
            <Button label="Activer les notifications" onPress={handleEnableNotifications} fullWidth />
            <Button label="Plus tard" variant="ghost" onPress={onDone} fullWidth />
          </View>
        ) : (
          <Button label="Suivant" onPress={() => goToIndex(index + 1)} fullWidth />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, height: 40 },
  skipText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  logo: { width: 220, height: 220, borderRadius: 24 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  description: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  actions: { gap: 10 },
});
