import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import '../i18n/config';
import ManualBarcodeDialog, { isBarcode } from '../src/preview/ManualBarcodeDialog';

/** Preview only: the browser has no camera, so a barcode is typed and the real lookup runs. */
const open = (onSubmit = jest.fn(), onClose = jest.fn()) => {
  render(
    <ThemeProvider initialTheme="light">
      <ManualBarcodeDialog visible onClose={onClose} onSubmit={onSubmit} />
    </ThemeProvider>
  );
  return { onSubmit, onClose };
};

it('accepts 6 to 14 digits only', () => {
  expect(isBarcode('3017620422003')).toBe(true);
  expect(isBarcode('123456')).toBe(true);
  expect(isBarcode('12345')).toBe(false);
  expect(isBarcode('123456789012345')).toBe(false);
  expect(isBarcode('30176204a')).toBe(false);
});

it('sends the digits to the lookup and closes', () => {
  const { onSubmit, onClose } = open();
  fireEvent.changeText(screen.getByLabelText('Barcode digits'), '3017 6204-22003');
  fireEvent.press(screen.getByRole('button', { name: 'Look up' }));
  expect(onSubmit).toHaveBeenCalledWith('3017620422003');
  expect(onClose).toHaveBeenCalled();
});

it('says what is wrong with a short code and does not look it up', () => {
  const { onSubmit, onClose } = open();
  fireEvent.changeText(screen.getByLabelText('Barcode digits'), '123');
  fireEvent.press(screen.getByRole('button', { name: 'Look up' }));
  expect(screen.getByText('Type 6 to 14 digits.')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
