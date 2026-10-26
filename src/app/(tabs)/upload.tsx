/**
 * Upload tab — placeholder until the feature is built.
 */
import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function UploadScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder icon="camera-outline" description={t('upload.description')} />;
}
