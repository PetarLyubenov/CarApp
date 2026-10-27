/**
 * Swipeable row of photos with dots underneath showing which one is visible.
 * With a single photo it's just the photo — no dots.
 */
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';

import { colors, spacing } from '@/constants/theme';

export function PhotoCarousel({ urls }: { urls: string[] }) {
  // The feed is full-width, so one page = the screen width.
  const { width } = useWindowDimensions();
  const height = (width * 3) / 4; // 4:3 photos
  const [index, setIndex] = useState(0);

  // Work out the visible page from how far the user has scrolled.
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  if (urls.length === 0) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  return (
    <View>
      <FlatList
        data={urls}
        keyExtractor={(url) => url}
        horizontal
        pagingEnabled // snap to whole photos
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          // expo-image caches photos, so scrolling back doesn't download them again
          <Image source={{ uri: item }} style={{ width, height }} contentFit="cover" transition={200} />
        )}
      />

      {urls.length > 1 && (
        <View style={styles.dots}>
          {urls.map((url, i) => (
            <View key={url} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.card },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
});
