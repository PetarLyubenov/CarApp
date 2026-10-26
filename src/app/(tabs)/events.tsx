/**
 * Events tab — placeholder until the feature is built.
 */
import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function EventsScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon="calendar-outline" description={t('events.description')} />;
}
