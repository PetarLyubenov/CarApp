/**
 * Bottom tab bar of the main app. Each <Tabs.Screen> matches a file in this folder
 * (index.tsx = Feed, search.tsx = Search, ...).
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
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
