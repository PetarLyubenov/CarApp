/**
 * Feed tab — placeholder until the feature is built.
 */
import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function FeedScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon="images-outline" description={t('feed.description')} />;
}
