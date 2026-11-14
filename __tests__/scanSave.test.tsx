import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import '../i18n/config';
import { foodScanService } from '../services';
import type { FoodScanDto } from '../services/foodScanService';
import { queryKeys } from '../services/queryKeys';
import { editItems, itemsFromScan } from '../src/scan/items';
import { applyScanToCaches, saveScanEdits, SaveOutcome } from '../src/scan/saveEdits';
import { ScanResult } from '../src/scan/ScanResult';
import { ToastProvider } from '../src/ui';

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
const httpError = (status: number) =>
  new AxiosError(
    'x',
    'ERR_BAD_RESPONSE',
    config,
    {},
    {
      status,
      statusText: '',
      headers: {},
      config,
      data: {},
    }
  );
const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK', config, {});

const scan = (grams = 200, extra: Record<string, unknown> = {}) =>
  ({
    id: 's1',
    imageUrl: 'https://img/1.jpg',
    status: 'COMPLETED',
    predictions: [
      {
        foodName: 'Chicken salad',
        confidence: 0.9,
        classId: 7,
        portionWeightG: grams,
        nutrition: { calories: 400, proteinG: 30, carbsG: 20, fatG: 20 },
        alternatives: [{ foodName: 'Caesar salad', confidence: 0.3 }],
      },
    ],
    nutritionSummary: {
      totalCalories: 400,
      totalProteinG: 30,
      totalCarbsG: 20,
      totalFatG: 20,
      itemCount: 1,
    },
    ...extra,
  }) as unknown as FoodScanDto;

let patch: jest.SpyInstance;
let get: jest.SpyInstance;
beforeEach(() => {
  patch = jest.spyOn(foodScanService, 'updateFoodScan');
  get = jest.spyOn(foodScanService, 'getFoodScan').mockResolvedValue(scan());
});
afterEach(() => jest.restoreAllMocks());

describe('saveScanEdits status paths', () => {
  const body = { items: [{ classId: 7, grams: 180 }] };

  it('200 resolves with the updated scan', async () => {
    const updated = scan(180, { userEdited: true });
    patch.mockResolvedValue(updated);
    await expect(saveScanEdits('s1', body)).resolves.toEqual({ kind: 'saved', scan: updated });
    expect(patch).toHaveBeenCalledWith('s1', body, undefined);
  });

  it('409 refetches the scan and retries once, then succeeds', async () => {
    patch.mockRejectedValueOnce(httpError(409)).mockResolvedValueOnce(scan(180));
    const out = await saveScanEdits('s1', body);
    expect(out.kind).toBe('saved');
    expect(get).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledTimes(2);
  });

  it('409 twice is a conflict, after exactly one retry', async () => {
    patch.mockRejectedValue(httpError(409));
    await expect(saveScanEdits('s1', body)).resolves.toEqual({ kind: 'conflict' });
    expect(patch).toHaveBeenCalledTimes(2);
  });

  it('404 means an older server: unsupported, no retry', async () => {
    patch.mockRejectedValue(httpError(404));
    await expect(saveScanEdits('s1', body)).resolves.toEqual({ kind: 'unsupported' });
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('400 is rejected, no retry', async () => {
    patch.mockRejectedValue(httpError(400));
    await expect(saveScanEdits('s1', body)).resolves.toEqual({ kind: 'rejected' });
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('offline and server errors are failures with a reason', async () => {
    patch.mockRejectedValueOnce(networkError());
    await expect(saveScanEdits('s1', body)).resolves.toEqual({ kind: 'failed', reason: 'offline' });
    patch.mockRejectedValueOnce(httpError(500));
    await expect(saveScanEdits('s1', body)).resolves.toEqual({ kind: 'failed', reason: 'server' });
  });
});

describe('editItems', () => {
  const items = itemsFromScan(scan(200));

  it('sends whole grams within 1 to 5000 and the new name only when it changed', () => {
    expect(editItems(items, { [items[0].key]: 0.9 }, {})).toEqual([{ classId: 7, grams: 180 }]);
    expect(editItems(items, {}, { [items[0].key]: 'Caesar salad' })).toEqual([
      { classId: 7, grams: 200, foodName: 'Caesar salad' },
    ]);
    expect(editItems(items, { [items[0].key]: 4 }, {})?.[0].grams).toBe(800);
    const big = itemsFromScan(scan(5000));
    expect(editItems(big, { [big[0].key]: 4 }, {})?.[0].grams).toBe(5000);
  });

  it('is null when the weight is unknown, so the edit stays on screen', () => {
    const noWeight = scan();
    delete (noWeight.predictions[0] as { portionWeightG?: number }).portionWeightG;
    expect(editItems(itemsFromScan(noWeight), {}, {})).toBeNull();
  });
});

describe('applyScanToCaches', () => {
  it('puts the corrected scan into the detail, Home and History caches', () => {
    const client = new QueryClient();
    const old = scan(200);
    client.setQueryData(queryKeys.scansRecent, [old]);
    client.setQueryData(queryKeys.scansHistory, {
      pages: [{ content: [old], number: 0, totalPages: 1, totalElements: 1, size: 20 }],
      pageParams: [0],
    });
    const fixed = scan(180, { nutritionSummary: { totalCalories: 360 } });
    applyScanToCaches(client, fixed);
    const recent = client.getQueryData(queryKeys.scansRecent) as FoodScanDto[];
    expect(recent[0].nutritionSummary?.totalCalories).toBe(360);
    const history = client.getQueryData(queryKeys.scansHistory) as {
      pages: { content: FoodScanDto[] }[];
    };
    expect(history.pages[0].content[0].nutritionSummary?.totalCalories).toBe(360);
    expect(client.getQueryData(queryKeys.scan('s1'))).toBe(fixed);
  });

  it('leaves a cache that was never loaded alone', () => {
    const client = new QueryClient();
    applyScanToCaches(client, scan());
    expect(client.getQueryData(queryKeys.scansRecent)).toBeUndefined();
    expect(client.getQueryData(queryKeys.scansHistory)).toBeUndefined();
  });
});

describe('ScanResult saving', () => {
  const open = (
    onSave: (b: unknown) => Promise<SaveOutcome>,
    s = scan(200, { needsConfirmation: true })
  ) =>
    render(
      <ThemeProvider initialTheme="light">
        <ToastProvider>
          <ScanResult
            scanResult={s}
            loading={false}
            recommendations={[]}
            loadingRecommendations={false}
            onSave={onSave as never}
          />
        </ToastProvider>
      </ThemeProvider>
    );
  const editOnce = () => {
    fireEvent.press(screen.getByRole('button', { name: 'Edit portions' }));
    fireEvent.press(screen.getByRole('button', { name: 'Smaller portion of Chicken salad' }));
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  };

  it('Done saves the new grams, shows no "this screen only" note, and says Saved', async () => {
    const onSave = jest.fn().mockResolvedValue({ kind: 'saved', scan: scan(180) });
    open(onSave);
    editOnce();
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ items: [{ classId: 7, grams: 180 }] })
    );
    expect(await screen.findByText('Saved')).toBeTruthy();
    expect(screen.queryByText(/this screen only/)).toBeNull();
  });

  it('Looks right sends confirmed: true', async () => {
    const onSave = jest.fn().mockResolvedValue({ kind: 'saved', scan: scan(200) });
    open(onSave);
    fireEvent.press(screen.getByRole('button', { name: 'Looks right' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ confirmed: true }));
  });

  it('choosing another food saves the new name', async () => {
    const onSave = jest.fn().mockResolvedValue({ kind: 'saved', scan: scan(200) });
    open(onSave, scan(200, { needsConfirmation: false }));
    fireEvent.press(screen.getByRole('button', { name: 'Edit portions' }));
    fireEvent.press(screen.getByRole('button', { name: 'Caesar salad' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        items: [{ classId: 7, grams: 200, foodName: 'Caesar salad' }],
      })
    );
  });

  it('rolls the edit back and shows a toast when the save fails', async () => {
    open(jest.fn().mockResolvedValue({ kind: 'failed', reason: 'offline' }));
    editOnce();
    expect(await screen.findByText(/You seem to be offline/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('400')).toBeTruthy());
  });

  it('a 409 that stays a conflict rolls back with its own message', async () => {
    open(jest.fn().mockResolvedValue({ kind: 'conflict' }));
    editOnce();
    expect(await screen.findByText(/changed or cannot be adjusted/)).toBeTruthy();
    expect(screen.getByText('400')).toBeTruthy();
  });

  it('a 404 keeps the edit on screen and says this server cannot save it', async () => {
    open(jest.fn().mockResolvedValue({ kind: 'unsupported' }));
    editOnce();
    expect(await screen.findByText(/this server cannot save them yet/)).toBeTruthy();
    expect(screen.getByText('360')).toBeTruthy();
  });

  it('does not save when nothing changed', async () => {
    const onSave = jest.fn();
    open(onSave);
    fireEvent.press(screen.getByRole('button', { name: 'Edit portions' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
