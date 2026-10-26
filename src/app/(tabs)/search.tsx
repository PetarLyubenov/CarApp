/**
 * Search tab — placeholder until the feature is built.
 */
import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function SearchScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon="search-outline" description={t('search.description')} />;
}
