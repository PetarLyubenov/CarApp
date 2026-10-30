/**
 * All badges. Each one is a goal on one of the numbers from user_stats():
 * when `stats[stat] >= goal`, the badge is earned.
 * To add a badge: add a line here, then its name in both translation files.
 */
import type { Ionicons } from '@expo/vector-icons';

import type { UserStats } from '@/services/badges';

export type BadgeCategory = 'spotting' | 'rare' | 'collector' | 'social';

export const BADGE_CATEGORIES: BadgeCategory[] = ['spotting', 'rare', 'collector', 'social'];

export const BADGES = [
  // Spotting milestones
  { id: 'first_spot', category: 'spotting', stat: 'spots', goal: 1, icon: 'camera' },
  { id: 'spotter', category: 'spotting', stat: 'spots', goal: 10, icon: 'camera' },
  { id: 'paparazzi', category: 'spotting', stat: 'spots', goal: 50, icon: 'aperture' },
  { id: 'street_legend', category: 'spotting', stat: 'spots', goal: 100, icon: 'trophy' },
  // Rare finds
  { id: 'rare_find', category: 'rare', stat: 'rare_spots', goal: 1, icon: 'diamond' },
  { id: 'exotic_hunter', category: 'rare', stat: 'rare_spots', goal: 5, icon: 'diamond' },
  { id: 'unicorn', category: 'rare', stat: 'rare_spots', goal: 25, icon: 'sparkles' },
  // Collector: different makes spotted
  { id: 'brand_fan', category: 'collector', stat: 'makes', goal: 5, icon: 'albums' },
  { id: 'encyclopedia', category: 'collector', stat: 'makes', goal: 15, icon: 'library' },
  { id: 'museum', category: 'collector', stat: 'makes', goal: 30, icon: 'business' },
  // Social and garage
  { id: 'liked', category: 'social', stat: 'likes_received', goal: 10, icon: 'heart' },
  { id: 'crowd_favorite', category: 'social', stat: 'likes_received', goal: 100, icon: 'flame' },
  { id: 'crew', category: 'social', stat: 'friends', goal: 5, icon: 'people' },
  { id: 'garage_owner', category: 'social', stat: 'cars', goal: 1, icon: 'car-sport' },
  { id: 'tuner', category: 'social', stat: 'mods', goal: 5, icon: 'construct' },
  { id: 'builder', category: 'social', stat: 'mods', goal: 20, icon: 'hammer' },
] as const satisfies readonly {
  id: string;
  category: BadgeCategory;
  stat: keyof UserStats;
  goal: number;
  icon: keyof typeof Ionicons.glyphMap;
}[];

export type Badge = (typeof BADGES)[number];

export function isEarned(badge: Badge, stats: UserStats): boolean {
  return stats[badge.stat] >= badge.goal;
}

export function earnedBadges(stats: UserStats): Badge[] {
  return BADGES.filter((badge) => isEarned(badge, stats));
}
