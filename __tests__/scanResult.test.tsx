import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import '../i18n/config';
import type { FoodScanDto } from '../services/foodScanService';
import { ScanProgress, SLOW_AFTER_SECONDS, stepStates } from '../src/scan/ScanProgress';
import { ScanResult } from '../src/scan/ScanResult';
import { ToastProvider } from '../src/ui';

const wrap = (ui: React.ReactElement) =>
  render(
    <ThemeProvider initialTheme="light">
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>
  );

const scan = (predictions: unknown[], extra: Record<string, unknown> = {}) =>
  ({
    id: 's1',
    imageUrl: 'https://img.example/1.jpg',
    status: 'COMPLETED',
    predictions,
    ...extra,
  }) as unknown as FoodScanDto;

const chicken = {
  foodName: 'Chicken salad',
  confidence: 0.9,
  classId: 1,
  nutrition: { calories: 400, proteinG: 30, carbsG: 20, fatG: 20, portion_weight_g: 200 },
};
const rice = {
  foodName: 'Rice',
  confidence: 0.4,
  classId: 2,
  nutrition: { calories: 200, proteinG: 4, carbsG: 44, fatG: 1 },
};

const open = (s: FoodScanDto, extra: Partial<React.ComponentProps<typeof ScanResult>> = {}) =>
  wrap(
    <ScanResult
      scanResult={s}
      loading={false}
      recommendations={['Drink water.']}
      loadingRecommendations={false}
      onScanAnother={jest.fn()}
      {...extra}
    />
  );

describe('ScanResult', () => {
  it('shows one big calorie number, the macro split and every item with its own calories', () => {
    open(scan([chicken, rice]));
    expect(screen.getByText('600')).toBeTruthy();
    expect(screen.getByText('Items found: 2')).toBeTruthy();
    expect(screen.getByText('Chicken salad')).toBeTruthy();
    expect(screen.getByText('Rice')).toBeTruthy();
    expect(screen.getByLabelText(/Macros: Protein \d+%, Carbs \d+%, Fat \d+%/)).toBeTruthy();
    expect(screen.getByText('Drink water.')).toBeTruthy();
    expect(screen.queryByText('Is this right?')).toBeNull(); // nothing asks for a check today
  });

  it('lets the portion be edited in grams: the totals follow, and the screen says it is not saved', () => {
    open(scan([chicken]));
    expect(screen.getByText('400')).toBeTruthy();
    expect(screen.queryByText(/this screen only/)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Edit portions' }));
    expect(screen.getByText('200 g')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Smaller portion of Chicken salad' }));
    expect(screen.getByText('180 g')).toBeTruthy();
    expect(screen.getByText('360')).toBeTruthy(); // 400 cal x 180 / 200
    expect(screen.getByText(/this screen only/)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('button', { name: /Smaller portion/ })).toBeNull();
    expect(screen.getByText('360')).toBeTruthy(); // the edit stays after Done
  });

  it('edits by quarter portions when the scan does not say how many grams', () => {
    open(scan([rice]));
    fireEvent.press(screen.getByRole('button', { name: 'Edit portions' }));
    expect(screen.getByText('1x')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Larger portion of Rice' }));
    expect(screen.getByText('1.25x')).toBeTruthy();
    expect(screen.getByText('250')).toBeTruthy();
  });

  it('marks a low-confidence item', () => {
    open(scan([chicken, rice]));
    expect(screen.getAllByText('Not sure')).toHaveLength(1);
  });

  it('asks to confirm when the scan says needs_confirmation, offers alternatives, and goes away once confirmed', () => {
    open(
      scan([{ ...rice, alternatives: [{ foodName: 'Couscous', confidence: 0.35 }] }], {
        needs_confirmation: true,
      })
    );
    expect(screen.getByText('Is this right?')).toBeTruthy();
    expect(screen.getByText('Could also be')).toBeTruthy();

    // Choosing the alternative renames the item on screen and nothing else.
    fireEvent.press(screen.getByRole('button', { name: 'Couscous' }));
    expect(screen.getAllByText('Couscous').length).toBeGreaterThan(0);
    expect(screen.queryByText('Rice')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Looks right' }));
    expect(screen.queryByText('Is this right?')).toBeNull();
  });

  it('"Something look off? Fix it" explains what to do when there are no alternatives, and can start a rescan', () => {
    const onScanAnother = jest.fn();
    open(scan([chicken]), { onScanAnother });
    fireEvent.press(screen.getByRole('button', { name: 'Something look off? Fix it' }));
    expect(screen.getByText('What looks off?')).toBeTruthy();
    expect(screen.getByText(/no other suggestions/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Scan again with a new photo' }));
    expect(onScanAnother).toHaveBeenCalled();
  });

  it('copes with a scan that has no items yet, and with the older flat field names', () => {
    open(scan([]));
    expect(screen.getByText('AI Analysis in Progress')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit portions' })).toBeNull();
  });

  it('shows placeholders while it loads', () => {
    wrap(
      <ScanResult scanResult={null} loading recommendations={[]} loadingRecommendations={false} />
    );
    expect(screen.getByLabelText('Loading results...')).toBeTruthy();
  });
});

describe('ScanProgress', () => {
  it('shows each step as finished, running or waiting for the stage the scan reports', () => {
    expect(stepStates('uploading')).toEqual(['active', 'todo', 'todo']);
    expect(stepStates('analyzing')).toEqual(['done', 'active', 'todo']);
    expect(stepStates('complete')).toEqual(['done', 'done', 'active']);
  });

  it('shows the time so far, says when it is slow, and always offers cancel', () => {
    const onCancel = jest.fn();
    const view = wrap(<ScanProgress stage="analyzing" seconds={3} onCancel={onCancel} />);
    expect(screen.getByText('3 s')).toBeTruthy();
    expect(screen.queryByText(/taking longer than usual/)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Cancel scan' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    view.rerender(
      <ThemeProvider initialTheme="light">
        <ToastProvider>
          <ScanProgress stage="analyzing" seconds={SLOW_AFTER_SECONDS} onCancel={onCancel} />
        </ToastProvider>
      </ThemeProvider>
    );
    expect(screen.getByText(/taking longer than usual/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel scan' })).toBeTruthy();
  });
});
