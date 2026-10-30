/**
 * A garage car as a card: cover photo, nickname, name and a short summary.
 * Used in your Garage tab and on profiles. Opens the car when tapped.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';
import type { CarSummary } from '@/services/garage';

export function CarCard({ car }: { car: CarSummary }) {
  const { t } = useTranslation();
  const name = [car.year, car.make, car.model].filter(Boolean).join(' ');
  const details = [
    car.horsepower ? `${car.horsepower} hp` : null,
    t('garage.mods', { count: car.modsCount }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/garage/[id]', params: { id: car.id } })}
    >
      {car.imageUrls[0] ? (
        <Image source={{ uri: car.imageUrls[0] }} style={styles.cover} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.cover, styles.noPhoto]}>
          <Ionicons name="car-sport" size={48} color={colors.border} />
        </View>
      )}
      <View style={styles.cardBody}>
        {car.nickname && <Text style={styles.nickname}>{car.nickname}</Text>}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.details}>{details}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.md, gap: 2 },
  nickname: { fontSize: 13, fontWeight: '600', color: colors.primary },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  details: { fontSize: 14, color: colors.textMuted },
});
