/**
 * Create an event. Only verified organizations and admins get here
 * (the button is hidden for others, and the database refuses them anyway).
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { ChipSelect } from '@/components/ChipSelect';
import { PhotoPicker } from '@/components/PhotoPicker';
import { PickerModal } from '@/components/PickerModal';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { MAKE_NAMES } from '@/data/carMakes';
import { getErrorMessage } from '@/lib/errors';
import { normalizeUrl, parseLocalDateTime } from '@/lib/format';
import { createEvent } from '@/services/events';
import type { LocalPhoto } from '@/services/photos';
import type { EventType } from '@/types/database';

// Same values as the `event_type` enum in supabase/schema.sql.
const EVENT_TYPES: EventType[] = ['show', 'meet', 'track_day', 'other'];

export default function NewEventScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;

  // ---- Form state ----
  const [cover, setCover] = useState<LocalPhoto[]>([]);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [price, setPrice] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [description, setDescription] = useState('');

  // ---- UI state ----
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePublish = async () => {
    if (!userId) return;

    // ---- Validation ----
    if (!title.trim()) return setError(t('events.needTitle'));
    if (!eventType) return setError(t('events.needType'));
    if (!locationName.trim()) return setError(t('events.needLocation'));

    const startsAt = parseLocalDateTime(startDate, startTime);
    if (!startsAt) return setError(t('events.invalidStart'));

    let endsAt: Date | null = null;
    if (endDate.trim() || endTime.trim()) {
      endsAt = parseLocalDateTime(endDate, endTime);
      if (!endsAt) return setError(t('events.invalidEnd'));
      if (endsAt <= startsAt) return setError(t('events.endBeforeStart'));
    }

    let priceNumber: number | null = null;
    if (price.trim()) {
      priceNumber = Number(price.trim().replace(',', '.'));
      if (!Number.isFinite(priceNumber) || priceNumber < 0) return setError(t('events.invalidPrice'));
    }

    let url: string | null = null;
    if (ticketUrl.trim()) {
      url = normalizeUrl(ticketUrl);
      if (!url) return setError(t('events.invalidUrl'));
    }

    // ---- Save ----
    setError(null);
    setSaving(true);
    try {
      const id = await createEvent({
        userId,
        cover: cover[0] ?? null,
        title: title.trim(),
        eventType,
        brand,
        locationName: locationName.trim(),
        address: address.trim() || null,
        startsAt,
        endsAt,
        price: priceNumber,
        ticketUrl: url,
        description: description.trim() || null,
      });
      router.replace({ pathname: '/events/[id]', params: { id } });
    } catch (e) {
      setError(getErrorMessage(e, t('common.error')));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>{t('events.coverOptional')}</Text>
        <PhotoPicker photos={cover} onChange={setCover} max={1} />

        <TextField
          label={t('events.title')}
          placeholder={t('events.titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
        />
        <ChipSelect
          label={t('events.type')}
          options={EVENT_TYPES.map((value) => ({ value, label: t(`eventTypes.${value}`) }))}
          value={eventType}
          onChange={setEventType}
        />
        <SelectField
          label={t('events.brand')}
          value={brand}
          placeholder={t('events.selectBrand')}
          onPress={() => setBrandPickerOpen(true)}
        />
        {brand && <Button title={t('events.allBrands')} onPress={() => setBrand(null)} variant="secondary" />}

        <TextField
          label={t('events.locationName')}
          placeholder={t('events.locationPlaceholder')}
          value={locationName}
          onChangeText={setLocationName}
          autoCapitalize="words"
        />
        <TextField label={t('events.address')} value={address} onChangeText={setAddress} autoCapitalize="words" />

        {/* Date and time side by side */}
        <View style={styles.row}>
          <View style={styles.wide}>
            <TextField
              label={t('events.startDate')}
              placeholder="2026-05-17"
              value={startDate}
              onChangeText={setStartDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>
          <View style={styles.narrow}>
            <TextField
              label={t('events.startTime')}
              placeholder="10:00"
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.wide}>
            <TextField
              label={t('events.endDate')}
              placeholder="2026-05-17"
              value={endDate}
              onChangeText={setEndDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>
          <View style={styles.narrow}>
            <TextField
              label={t('events.endTime')}
              placeholder="18:00"
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>

        <TextField label={t('events.priceLabel')} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <TextField
          label={t('events.ticketUrl')}
          placeholder="https://"
          value={ticketUrl}
          onChangeText={setTicketUrl}
          keyboardType="url"
        />
        <TextField
          label={t('events.about')}
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="sentences"
          style={styles.multiline}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title={t('events.publish')} onPress={handlePublish} loading={saving} />
      </ScrollView>

      <PickerModal
        visible={brandPickerOpen}
        title={t('upload.selectMake')}
        options={MAKE_NAMES}
        allowCustom
        onClose={() => setBrandPickerOpen(false)}
        onSelect={(value) => {
          setBrand(value);
          setBrandPickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  section: { fontSize: 14, fontWeight: '500', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm },
  wide: { flex: 3 },
  narrow: { flex: 2 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.error },
});
