/**
 * Square thumbnail of a spot for grids (search results). Opens the spot when tapped.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';
import type { FeedSpot } from '@/services/spots';

type Props = { spot: FeedSpot; size: number };

export function SpotGridItem({ spot, size }: Props) {
  return (
    <Pressable
      style={{ width: size, height: size }}
      onPress={() => router.push({ pathname: '/spot/[id]', params: { id: spot.id } })}
    >
      <Image
        source={spot.imageUrls[0] ? { uri: spot.imageUrls[0] } : null}
        style={styles.image}
        contentFit="cover"
        transition={150}
      />
      {/* Gold diamond in the corner for rare cars */}
      {spot.isRare && (
        <View style={styles.rare}>
          <Ionicons name="diamond" size={12} color={colors.gold} />
        </View>
      )}
      {/* Dark strip with the car name, readable on any photo */}
      <View style={styles.label}>
        <Text style={styles.labelText} numberOfLines={1}>
          {spot.make} {spot.model}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: { flex: 1, backgroundColor: colors.card },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  labelText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  rare: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
