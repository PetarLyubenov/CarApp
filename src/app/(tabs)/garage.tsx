/**
 * Garage tab — placeholder until the feature is built.
 * Holds a temporary sign-out button until we add a profile/settings screen.
 */
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';
import { useAuth } from '@/context/AuthContext';

export default function GarageScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <ScreenPlaceholder icon="car-sport-outline" description={t('garage.description')}>
      <Button title={t('common.signOut')} onPress={signOut} variant="secondary" />
    </ScreenPlaceholder>
  );
}
