/**
 * Bottom tab bar of the main app. Each <Tabs.Screen> matches a file in this folder
 * (index.tsx = Feed, search.tsx = Search, ...).
 */
import { Alert, Pressable, StyleSheet } from 'react-native';
import { router, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { takePhoto } from '@/lib/camera';

type IconName = keyof typeof Ionicons.glyphMap;
// Helper that builds the icon for a tab: filled + red when selected, grey outline otherwise.
function tabIcon(active: IconName, inactive: IconName) {
  return ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons
      name={focused ? active : inactive}
      color={focused ? colors.primary : colors.textMuted}
      size={size}
    />
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const myId = session?.user.id ?? '';

  // Camera button: shoot first, then fill in the short form on the next screen.
  const openCamera = async () => {
    const photo = await takePhoto();
    if (photo === 'denied') Alert.alert(t('upload.cameraDenied'));
    else if (photo) {
      router.push({ pathname: '/capture', params: { uri: photo.uri, width: String(photo.width) } });
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Camera in the top-left corner of every tab.
        headerLeft: () => (
          <Pressable
            onPress={openCamera}
            hitSlop={8}
            style={styles.cameraButton}
            accessibilityLabel={t('capture.openCamera')}
          >
            <Ionicons name="camera-outline" size={28} color={colors.primary} />
          </Pressable>
        ),
        // Profile button in the top-right corner of every tab.
        headerRight: () => (
          <Pressable
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: myId } })}
            hitSlop={8}
            style={styles.profileButton}
            accessibilityLabel={t('profile.myProfile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.feed'), tabBarIcon: tabIcon('images', 'images-outline') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: t('tabs.search'), tabBarIcon: tabIcon('search', 'search-outline') }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: t('tabs.upload'),
          tabBarIcon: tabIcon('add-circle', 'add-circle-outline'),
        }}
      />
      <Tabs.Screen
        name="garage"
        options={{ title: t('tabs.garage'), tabBarIcon: tabIcon('car-sport', 'car-sport-outline') }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: t('tabs.events'), tabBarIcon: tabIcon('calendar', 'calendar-outline') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cameraButton: { marginLeft: spacing.md },
  profileButton: { marginRight: spacing.md },
});
