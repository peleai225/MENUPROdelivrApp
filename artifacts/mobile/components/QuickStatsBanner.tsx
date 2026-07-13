import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Stat {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  gradientStart: string;
  gradientEnd: string;
}

const STATS: Stat[] = [
  { icon: 'zap', label: 'Livraison', value: '30 min', gradientStart: '#f97316', gradientEnd: '#fb923c' },
  { icon: 'shield', label: 'Paiement', value: 'Sécurisé', gradientStart: '#1BC5FD', gradientEnd: '#06b6d4' },
  { icon: 'star', label: 'Restaurants', value: '50+', gradientStart: '#7c3aed', gradientEnd: '#a855f7' },
];

export function QuickStatsBanner() {
  return (
    <View style={styles.row}>
      {STATS.map((s, i) => (
        <LinearGradient
          key={i}
          colors={[s.gradientStart, s.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.item}
        >
          <View style={styles.iconWrap}>
            <Feather name={s.icon} size={16} color="#ffffff" />
          </View>
          <Text style={styles.value}>{s.value}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </LinearGradient>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  item: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#ffffff' },
  label: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)' },
});
