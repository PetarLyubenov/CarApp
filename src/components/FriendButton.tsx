/**
 * The friend button on someone's profile. What it shows depends on the friend status:
 *   none -> "Add friend"      outgoing -> "Request sent · Cancel"
 *   incoming -> "Accept" + "Decline"      friends -> "Friends ✓" (tap to remove)
 */
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
  type FriendStatus,
} from '@/services/friends';

type Props = {
  me: string;
  them: string;
  username: string;
  status: FriendStatus;
  /** Called after a change, so the profile can reload (friends may now see more). */
  onChange: () => void;
};

export function FriendButton({ me, them, username, status, onChange }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  // Run an action with a spinner and error handling, then let the profile reload.
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      onChange();
    } catch (e) {
      Alert.alert(getErrorMessage(e, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = () => {
    Alert.alert(t('profile.removeFriend'), t('profile.removeFriendConfirm', { username }), [
      { text: t('garage.cancel'), style: 'cancel' },
      { text: t('profile.removeFriend'), style: 'destructive', onPress: () => run(() => removeFriendship(me, them)) },
    ]);
  };

  switch (status) {
    case 'none':
      return <Button title={t('profile.addFriend')} onPress={() => run(() => sendFriendRequest(me, them))} loading={busy} />;
    case 'outgoing':
      return (
        <Button
          title={t('profile.requestSent')}
          onPress={() => run(() => removeFriendship(me, them))}
          loading={busy}
          variant="secondary"
        />
      );
    case 'incoming':
      return (
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              title={t('profile.decline')}
              onPress={() => run(() => removeFriendship(me, them))}
              variant="secondary"
            />
          </View>
          <View style={styles.flex}>
            <Button title={t('profile.accept')} onPress={() => run(() => acceptFriendRequest(me, them))} loading={busy} />
          </View>
        </View>
      );
    case 'friends':
      return <Button title={t('profile.isFriend')} onPress={confirmRemove} loading={busy} variant="secondary" />;
    default:
      return null; // 'self' — no button on your own profile
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
