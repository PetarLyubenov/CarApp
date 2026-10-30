/**
 * Make + model fields with their searchable pickers — shared by every car form
 * (upload a spot, add a garage car, quick camera).
 * Choosing a different make clears the model, because the old model belongs to the old make.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PickerModal } from '@/components/PickerModal';
import { SelectField } from '@/components/SelectField';
import { CAR_MAKES, MAKE_NAMES } from '@/data/carMakes';

export type MakeModel = { make: string | null; model: string | null };

type Props = {
  value: MakeModel;
  onChange: (value: MakeModel) => void;
};

export function MakeModelFields({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [openPicker, setOpenPicker] = useState<'make' | 'model' | null>(null);
  const { make, model } = value;

  return (
    <>
      <SelectField
        label={t('upload.make')}
        value={make}
        placeholder={t('upload.selectMake')}
        onPress={() => setOpenPicker('make')}
      />
      <SelectField
        label={t('upload.model')}
        value={model}
        placeholder={make ? t('upload.selectModel') : t('upload.selectMakeFirst')}
        onPress={() => setOpenPicker('model')}
        disabled={!make}
      />

      {/* ---- Pickers (hidden until opened) ---- */}
      <PickerModal
        visible={openPicker === 'make'}
        title={t('upload.selectMake')}
        options={MAKE_NAMES}
        allowCustom
        onClose={() => setOpenPicker(null)}
        onSelect={(newMake) => {
          onChange({ make: newMake, model: newMake === make ? model : null });
          setOpenPicker(null);
        }}
      />
      <PickerModal
        visible={openPicker === 'model'}
        title={t('upload.selectModel')}
        options={make ? (CAR_MAKES[make] ?? []) : []}
        allowCustom
        onClose={() => setOpenPicker(null)}
        onSelect={(newModel) => {
          onChange({ make, model: newModel });
          setOpenPicker(null);
        }}
      />
    </>
  );
}
