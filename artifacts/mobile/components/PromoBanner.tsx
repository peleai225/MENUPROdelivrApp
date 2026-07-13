import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 140;

export interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  cta?: string;
  emoji: string;
  bg: string;
  /** URL d'une image de fond (optionnelle). Si absente, le fond uni `bg` est utilisé. */
  imageUrl?: string;
  textColor?: string;
  onPress?: () => void;
}

const DEFAULT_PROMOS: PromoSlide[] = [
  {
    id: '1',
    emoji: '🆓',
    title: 'Livraison offerte',
    subtitle: 'Sur votre 1ère commande avec Wave',
    cta: 'En profiter',
    bg: '#f97316',
    textColor: '#ffffff',
  },
  {
    id: '2',
    emoji: '🔥',
    title: 'Happy Hour',
    subtitle: 'De 12h à 14h : -20% sur tous les menus',
    cta: 'Commander',
    bg: '#1e293b',
    textColor: '#ffffff',
  },
  {
    id: '3',
    emoji: '🎉',
    title: 'Nouveau restaurant',
    subtitle: 'Découvrez les nouvelles adresses près de vous',
    cta: 'Explorer',
    bg: '#7c3aed',
    textColor: '#ffffff',
  },
];

interface Props {
  slides?: PromoSlide[];
}

export function PromoBanner({ slides = DEFAULT_PROMOS }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => <PromoCard item={item} width={CARD_WIDTH} />}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        contentContainerStyle={{ paddingRight: 16 }}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? '#f97316' : '#d1d5db',
                width: i === activeIndex ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function PromoCard({ item, width }: { item: PromoSlide; width: number }) {
  const textColor = item.textColor ?? '#ffffff';

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={item.onPress}
      style={[styles.slide, { width, backgroundColor: item.bg }]}
    >
      {/* Image de fond si fournie */}
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      )}

      {/* Gradient sombre sur l'image pour lisibilité du texte */}
      <LinearGradient
        colors={
          item.imageUrl
            ? ['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.8)']
            : [`${item.bg}00`, `${item.bg}99`, item.bg]
        }
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      />

      {/* Cercle décoratif flou en haut à droite */}
      <View style={[styles.decorCircle, { backgroundColor: textColor + '18' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: textColor + '10' }]} />

      <View style={styles.content}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: textColor + 'cc' }]}>{item.subtitle}</Text>
          {item.cta && (
            <View style={[styles.ctaWrap, { borderColor: textColor + '55' }]}>
              <Text style={[styles.ctaText, { color: textColor }]}>{item.cta} →</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  slide: {
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  decorCircle2: {
    position: 'absolute',
    top: 40,
    right: 50,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 16,
    paddingBottom: 18,
  },
  emoji: { fontSize: 36, lineHeight: 42 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', lineHeight: 21 },
  subtitle: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 17, marginTop: 3 },
  ctaWrap: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ctaText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
});
