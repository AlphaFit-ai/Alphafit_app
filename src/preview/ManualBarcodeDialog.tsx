import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Input } from '../ui';
import { MANUAL_BARCODE_COPY } from './copy';

interface ManualBarcodeDialogProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the digits; the screen then runs the same lookup a scanned barcode starts. */
  onSubmit: (barcode: string) => void;
}

export const isBarcode = (value: string): boolean => /^[0-9]{6,14}$/.test(value);

/**
 * Preview only: the browser has no camera, so a barcode is typed instead of scanned. Everything after
 * that is the real flow (`GET /barcodes/lookup/{barcode}` and the result screen).
 */
export default function ManualBarcodeDialog({
  visible,
  onClose,
  onSubmit,
}: ManualBarcodeDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  const close = () => {
    setValue('');
    setError(undefined);
    onClose();
  };

  const submit = () => {
    const digits = value.trim();
    if (!isBarcode(digits)) {
      setError(MANUAL_BARCODE_COPY.invalid);
      return;
    }
    close();
    onSubmit(digits);
  };

  return (
    <Dialog
      visible={visible}
      title={MANUAL_BARCODE_COPY.title}
      message={MANUAL_BARCODE_COPY.message}
      onClose={close}
      actions={[
        { label: MANUAL_BARCODE_COPY.lookUp, keepOpen: true, onPress: submit },
        { label: t('common.cancel'), tone: 'cancel' },
      ]}
    >
      <Input
        label={MANUAL_BARCODE_COPY.label}
        placeholder={MANUAL_BARCODE_COPY.placeholder}
        value={value}
        onChangeText={(text) => {
          setValue(text.replace(/[^0-9]/g, ''));
          setError(undefined);
        }}
        keyboardType="number-pad"
        maxLength={14}
        error={error}
        onSubmitEditing={submit}
      />
    </Dialog>
  );
}
