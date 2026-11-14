import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import HistoryScreen from '../app/history';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';

jest.mock('expo-router', () => {
  const Stack = {
    // The filter button is a header option; render it inline so the test can press it.
    Screen: ({ options }: { options?: { headerRight?: () => React.ReactNode } }) =>
      options?.headerRight ? options.headerRight() : null,
  };
  return { Stack, useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }) };
});
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK', config, {});

let counter = 0;
const scan = (name: string, status = 'COMPLETED') => ({
  id: `s${(counter += 1)}`,
  imageUrl: `https://img/${counter}.jpg`,
  status,
  createdAt: new Date(2026, 10, 13, 12, 0).toISOString(),
  predictions: [{ foodName: name }],
  nutritionSummary: { totalCalories: 100 },
});
const page = (items: unknown[], number: number, totalPages = 3) => ({
  data: {
    success: true,
    data: { content: items, number, totalPages, totalElements: 60, size: 20 },
  },
});

const open = () =>
  render(
    <AppProviders>
      <HistoryScreen />
    </AppProviders>
  );
const endReached = () => fireEvent(screen.UNSAFE_getByType(FlatList), 'endReached');
const pageRequests = () =>
  mockApi.get.mock.calls.filter(([url]: [string]) => url === '/food-scans').length;

beforeEach(() => {
  mockApi.get.mockReset();
  counter = 0;
});

describe('History', () => {
  it('asks for one page at a time, however often the list reaches its end', async () => {
    let release!: (value: unknown) => void;
    mockApi.get
      .mockResolvedValueOnce(page([scan('Soup')], 0))
      .mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
    open();
    await screen.findByText('Soup');

    endReached();
    endReached();
    endReached();
    await waitFor(() => expect(pageRequests()).toBe(2)); // the first page and ONE more
    expect(pageRequests()).toBe(2);

    await act(async () => release(page([scan('Stew')], 1)));
    expect(await screen.findByText('Stew')).toBeTruthy();
  });

  it('shows an error with a retry, not "No History Yet", when the first page fails', async () => {
    mockApi.get.mockRejectedValueOnce(networkError());
    open();
    expect(await screen.findByText(/offline/i)).toBeTruthy();
    expect(screen.queryByText('No History Yet')).toBeNull();

    mockApi.get.mockResolvedValueOnce(page([scan('Soup')], 0, 1));
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Soup')).toBeTruthy();
  });

  it('says so when there are no scans at all', async () => {
    mockApi.get.mockResolvedValueOnce(page([], 0, 1));
    open();
    expect(await screen.findByText('No History Yet')).toBeTruthy();
  });

  it('keeps the list and shows a banner when a refresh fails', async () => {
    mockApi.get.mockResolvedValueOnce(page([scan('Soup')], 0, 1));
    open();
    await screen.findByText('Soup');

    mockApi.get.mockRejectedValueOnce(networkError());
    await act(async () => {
      fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
    });
    expect(await screen.findByText('Could not refresh. Tap to try again.')).toBeTruthy();
    expect(screen.getByText('Soup')).toBeTruthy();
  });

  it('keeps the list when the next page fails, retries only on request, and does not hammer the api', async () => {
    mockApi.get
      .mockResolvedValueOnce(page([scan('Soup')], 0))
      .mockRejectedValueOnce(networkError());
    open();
    await screen.findByText('Soup');
    endReached();
    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByText('Soup')).toBeTruthy();

    const before = pageRequests();
    endReached();
    endReached();
    expect(pageRequests()).toBe(before); // a failed page is not retried by scrolling

    mockApi.get.mockResolvedValueOnce(page([scan('Stew')], 1));
    fireEvent.press(retry);
    expect(await screen.findByText('Stew')).toBeTruthy();
  });

  it('a filter only looks at the loaded pages, says so, and offers older scans', async () => {
    mockApi.get
      .mockResolvedValueOnce(page([scan('Soup'), scan('Burnt toast', 'FAILED')], 0))
      // the filter fetches a few more pages by itself; none of them has a failed scan
      .mockResolvedValue(page([scan('Rice')], 1, 40));
    open();
    await screen.findByText('Soup');

    fireEvent.press(screen.getByRole('button', { name: 'Filter By' }));
    const options = await screen.findAllByRole('button', { name: /Failed/ });
    // The filter option itself, not a list row whose label mentions the status.
    fireEvent.press(options.find((n) => n.props.accessibilityLabel === 'Failed')!);

    expect(
      await screen.findByText(/Showing matches among the \d+ scans loaded so far\./)
    ).toBeTruthy();
    expect(screen.getByText('Burnt toast')).toBeTruthy();
    expect(screen.queryByText('Soup')).toBeNull();

    // It stops after a few automatic pages and leaves the rest to the button.
    await waitFor(() => expect(pageRequests()).toBeGreaterThan(1));
    await waitFor(() => expect(pageRequests()).toBeLessThanOrEqual(6));
    expect(await screen.findByRole('button', { name: 'Load older scans' })).toBeTruthy();
  });
});
