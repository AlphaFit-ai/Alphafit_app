import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import '../i18n/config';
import type { FoodScanDto } from '../services/foodScanService';
import type { SaveOutcome } from '../src/scan/saveEdits';
import { ScanResult } from '../src/scan/ScanResult';
import { ToastProvider } from '../src/ui';

/**
 * Per-item confirmation and one-tap alternatives (CONTRACTS 3.7): an item the model is not sure about
 * is marked, its alternatives with nutrition switch it in one tap (`alternativeClassId`), the others only
 * rename it. The shape is the one the local api returns for seed-scan-demo-02, plus a second item.
 */
const veggie = {
  foodName: 'veggie burger',
  confidence: 0.433,
  classId: 104,
  portionWeightG: 220,
  nutrition: { calories: 389, proteinG: 34.5, carbsG: 31.5, fatG: 13.9 },
};
const meal = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'seed-scan-demo-02',
    imageUrl: 'https://img/2.jpg',
    status: 'COMPLETED',
    needsConfirmation: true,
    alternatives: [{ foodName: 'veggie burger', confidence: 0.433 }],
    predictions: [
      {
        foodName: 'hamburger',
        confidence: 0.5421,
        classId: 53,
        portionWeightG: 220,
        nutrition: { calories: 480, proteinG: 31.5, carbsG: 42.5, fatG: 19.6 },
        needsConfirmation: true,
        alternatives: [veggie, { foodName: 'falafel wrap', confidence: 0.02 }],
      },
      {
        foodName: 'french fries',
        confidence: 0.93,
        classId: 40,
        portionWeightG: 117,
        nutrition: { calories: 365, proteinG: 4, carbsG: 48, fatG: 17 },
        needsConfirmation: false,
        alternatives: [],
      },
    ],
    ...overrides,
  }) as unknown as FoodScanDto;

/** What the api answers after applying alternative 104 (verified against the local api). */
const applied = meal({
  needsConfirmation: undefined,
  alternatives: undefined,
  userEdited: true,
  predictions: [{ ...veggie, needsConfirmation: false, alternatives: [] }, meal().predictions[1]],
});

function open(
  onSave: (body: unknown) => Promise<SaveOutcome>,
  scan = meal(),
  onScanAnother?: () => void
) {
  const utils = render(
    <ThemeProvider initialTheme="light">
      <ToastProvider>
        <ScanResult
          scanResult={scan}
          loading={false}
          recommendations={[]}
          loadingRecommendations={false}
          onSave={onSave as never}
          onScanAnother={onScanAnother}
        />
      </ToastProvider>
    </ThemeProvider>
  );
  return utils;
}

const burgerCard = () => screen.getByTestId(/^scan-item-0-/);
const friesCard = () => screen.getByTestId(/^scan-item-1-/);

it('marks only the item that needs confirming and shows its alternatives with their calories', () => {
  open(jest.fn());
  expect(within(burgerCard()).getByText('Not sure')).toBeTruthy();
  expect(within(burgerCard()).getByText('Veggie burger · 389 cal')).toBeTruthy();
  expect(within(friesCard()).queryByText('Not sure')).toBeNull();
  expect(within(friesCard()).queryByText('Could also be')).toBeNull();
  // Two items: the card at the top points to the marked ones.
  expect(screen.getByText(/the items marked below/)).toBeTruthy();
  expect(screen.getByText('845')).toBeTruthy(); // 480 + 365
});

it('one tap on an alternative with nutrition sends alternativeClassId and shows that food at once', async () => {
  let finish!: (outcome: SaveOutcome) => void;
  const onSave = jest.fn(() => new Promise<SaveOutcome>((resolve) => (finish = resolve)));
  open(onSave);
  fireEvent.press(screen.getByRole('button', { name: 'Change to Veggie burger, 389 cal' }));
  expect(onSave).toHaveBeenCalledWith({ items: [{ classId: 53, alternativeClassId: 104 }] });
  // Before the api answers: the item is the veggie burger, the total follows, nothing left to confirm.
  expect(within(burgerCard()).getByText('Veggie burger')).toBeTruthy();
  expect(within(burgerCard()).queryByText('Not sure')).toBeNull();
  expect(screen.getByText('754')).toBeTruthy(); // 389 + 365
  expect(screen.queryByText('Is this right?')).toBeNull();
  finish({ kind: 'saved', scan: applied });
  expect(await screen.findByText('Saved')).toBeTruthy();
});

it('an alternative without nutrition only renames the item, and says the numbers stay', async () => {
  const onSave = jest.fn().mockResolvedValue({ kind: 'saved', scan: meal() });
  open(onSave);
  expect(within(burgerCard()).getByText(/only renames the item/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Rename to Falafel wrap' }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({ items: [{ classId: 53, foodName: 'falafel wrap' }] })
  );
});

it('when the api cannot apply the alternative (409), it offers to rename instead or scan again', async () => {
  const onScanAnother = jest.fn();
  const onSave = jest
    .fn()
    .mockResolvedValueOnce({ kind: 'alternativeUnavailable' })
    .mockResolvedValueOnce({ kind: 'saved', scan: meal() });
  open(onSave, meal(), onScanAnother);
  fireEvent.press(screen.getByRole('button', { name: 'Change to Veggie burger, 389 cal' }));
  expect(await screen.findByText('No nutrition data for Veggie burger')).toBeTruthy();
  // The pick was undone: the hamburger and its calories are back.
  expect(within(burgerCard()).getByText('Hamburger')).toBeTruthy();
  expect(screen.getByText('845')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Scan again with a new photo' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Rename only' }));
  await waitFor(() =>
    expect(onSave).toHaveBeenLastCalledWith({
      items: [{ classId: 53, foodName: 'veggie burger' }],
    })
  );
});

it('puts the item back and says why when the save fails', async () => {
  open(jest.fn().mockResolvedValue({ kind: 'failed', reason: 'offline' }));
  fireEvent.press(screen.getByRole('button', { name: 'Change to Veggie burger, 389 cal' }));
  expect(await screen.findByText(/You seem to be offline/)).toBeTruthy();
  expect(within(burgerCard()).getByText('Hamburger')).toBeTruthy();
  expect(screen.getByText('845')).toBeTruthy();
});

it('a 400 for a choice that is no longer offered says so, not "1 to 5000 g"', async () => {
  open(jest.fn().mockResolvedValue({ kind: 'rejected' }));
  fireEvent.press(screen.getByRole('button', { name: 'Change to Veggie burger, 389 cal' }));
  expect(await screen.findByText(/no longer offered for this item/)).toBeTruthy();
});

it('after the save the scan from the api is shown as it is: confirmed, no alternatives left', () => {
  open(jest.fn(), applied);
  expect(within(burgerCard()).getByText('Veggie burger')).toBeTruthy();
  expect(screen.queryByText('Not sure')).toBeNull();
  expect(screen.queryByText('Could also be')).toBeNull();
  expect(screen.queryByText('Is this right?')).toBeNull();
  expect(screen.getByText(/edited by you/)).toBeTruthy();
});

it('a low confidence alone marks nothing when the scan says per item what to check', () => {
  // seed-scan-demo-03 on the local api: salmon 0.62 (not flagged), sushi 0.47 (flagged).
  const scan = meal();
  (scan.predictions[1] as { confidence: number }).confidence = 0.3;
  open(jest.fn(), scan);
  expect(within(friesCard()).queryByText('Not sure')).toBeNull();
  expect(within(burgerCard()).getByText('Not sure')).toBeTruthy();
});

it('an older scan with the fields on the scan only still asks to confirm, on its first item', () => {
  const older = meal({
    predictions: meal().predictions.map((p) => {
      const {
        needsConfirmation: _n,
        alternatives: _a,
        ...rest
      } = p as unknown as Record<string, unknown>;
      return rest;
    }),
  });
  open(jest.fn(), older);
  expect(screen.getByText('Is this right?')).toBeTruthy();
  expect(within(burgerCard()).getByText('Not sure')).toBeTruthy();
  // Names only on the scan: a rename, not a one-tap switch.
  expect(
    within(burgerCard()).getByRole('button', { name: 'Rename to Veggie burger' })
  ).toBeTruthy();
  expect(within(friesCard()).queryByText('Not sure')).toBeNull();
});
