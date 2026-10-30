/**
 * Round avatar with the first letter of the name — until we add profile photos.
 * The color is picked from the name, so each person always gets the same one.
 */
import { StyleSheet, Text, View } from 'react-native';

const COLORS = ['#A855F7', '#7C3AED', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#6366F1'];

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  // Simple hash: add up the character codes, then pick a color.
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  const backgroundColor = COLORS[sum % COLORS.length];

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: '#fff', fontWeight: '700' },
});
