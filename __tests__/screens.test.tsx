import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import { RefreshControl, Text } from 'react-native';
import DietScreen from '../app/(tabs)/diet';
import HomeScreen from '../app/(tabs)/home';
import { LaunchScreen } from '../components/LaunchScreen';
import { runLaunchCheck } from '../services/launch';
import { useSession } from '../services/sessionStore';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';

// ---- mocks -------------------------------------------------------------------------------------

const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
  Stack: { Screen: () => null },
}));

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

// The Diet tab shows one of these screens depending on the step; replace them with markers.
jest.mock('../app/diet/diet-preference', () => ({
  __esModule: true,
  default: () => mockMarker('step-preference'),
}));
jest.mock('../app/diet/allergies', () => ({
  __esModule: true,
  default: () => mockMarker('step-allergies'),
}));
jest.mock('../app/diet/meals', () => ({
  __esModule: true,
  default: () => mockMarker('step-meals'),
}));
jest.mock('../app/diet/supplements', () => ({
  __esModule: true,
  default: () => mockMarker('step-supplements'),
}));
jest.mock('../app/diet/food-scan', () => ({
  __esModule: true,
  default: () => mockMarker('step-food-scan'),
}));
jest.mock('../app/diet/diet-statistics', () => ({
  __esModule: true,
  default: () => mockMarker('step-statistics'),
}));
jest.mock('../app/diet/barcode-result', () => ({
  __esModule: true,
  default: () => mockMarker('step-barcode'),
}));

function mockMarker(testID: string) {
  const { Text: T } = jest.requireActual('react-native');
  const { createElement } = jest.requireActual('react');
  return createElement(T, { testID }, testID);
}

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK', config, {});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

// ---- launch screen -------------------------------------------------------------------------------

describe('LaunchScreen', () => {
  it('shows why the launch check failed with a retry, instead of any app screen', async () => {
    const onRetry = jest.fn();
    renderWithProviders(<LaunchScreen error="offline" onRetry={onRetry} />);

    expect(screen.getByText("We can't reach AlphaFit")).toBeTruthy();
    expect(
      screen.getByText('You seem to be offline. Check your connection and try again.')
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows only the logo while the check runs', () => {
    renderWithProviders(<LaunchScreen error={null} onRetry={jest.fn()} />);
    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('retry runs the check again and the result reaches the session store (no navigation by hand)', async () => {
    const run = jest
      .fn()
      .mockResolvedValueOnce({ kind: 'retry', reason: 'timeout' })
      .mockResolvedValueOnce({
        kind: 'ready',
        data: {},
        route: '/(tabs)/home',
        step: 9,
        complete: true,
      });

    function Host() {
      const session = useSession();
      return session.status === 'loading' ? (
        <LaunchScreen error={session.launchError} onRetry={() => void runLaunchCheck(run)} />
      ) : (
        <Text testID="app">{session.status}</Text>
      );
    }
    renderWithProviders(<Host />);
    await act(async () => {
      await runLaunchCheck(run);
    });

    fireEvent.press(await screen.findByText('Try again'));

    expect(await screen.findByTestId('app')).toBeTruthy();
    expect(screen.getByTestId('app').props.children).toBe('ready');
    expect(run).toHaveBeenCalledTimes(2);
  });
});

// ---- Diet tab ---------------------------------------------------------------------------------------

describe('Diet tab', () => {
  it('opens at the first unanswered question', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { dietPreference: 'vegan', hasAllergies: false } },
    });
    renderWithProviders(<DietScreen />);
    expect(await screen.findByTestId('step-meals')).toBeTruthy();
  });

  it('starts at the first question only when the user really has no answers', async () => {
    mockApi.get.mockResolvedValue({ data: { data: null } });
    renderWithProviders(<DietScreen />);
    expect(await screen.findByTestId('step-preference')).toBeTruthy();
  });

  it('shows a retry, not the first question, when the answers could not be loaded', async () => {
    mockApi.get.mockRejectedValue(networkError());
    renderWithProviders(<DietScreen />);

    expect(await screen.findByText('Try again')).toBeTruthy();
    expect(screen.queryByTestId('step-preference')).toBeNull();
  });

  it('continues where the user was after the retry succeeds', async () => {
    mockApi.get.mockRejectedValueOnce(networkError()).mockResolvedValueOnce({
      data: {
        data: {
          dietPreference: 'vegan',
          hasAllergies: true,
          mealsPerDay: 3,
          takesSupplements: false,
        },
      },
    });
    renderWithProviders(<DietScreen />);

    fireEvent.press(await screen.findByText('Try again'));

    expect(await screen.findByTestId('step-food-scan')).toBeTruthy();
  });
});

// ---- Home ------------------------------------------------------------------------------------------------

describe('Home', () => {
  const today = new Date().toISOString();
  const scan = {
    id: 'scan-1',
    imageUrl: 'https://img.example/1.jpg',
    status: 'COMPLETED',
    createdAt: today,
    predictions: [{ foodName: 'Chicken salad' }],
    nutritionSummary: { totalCalories: 420, totalProteinG: 31, totalCarbsG: 12, totalFatG: 22 },
  };

  function answerApi(handlers: Record<string, unknown>) {
    mockApi.get.mockImplementation((url: string) => {
      const answer = handlers[url];
      if (answer instanceof Error) return Promise.reject(answer);
      if (answer === undefined) return Promise.reject(new Error(`unexpected request ${url}`));
      return Promise.resolve({ data: answer });
    });
  }

  const goodAnswers = {
    '/onboarding': {
      data: {
        goal: 'build-muscle',
        fitnessLevel: 'beginner',
        dateOfBirth: { month: 1, day: 1, year: 2000 },
      },
    },
    '/onboarding/projection': { data: { sleepHours: '7-8' } },
    '/food-scans': {
      success: true,
      data: { content: [scan], totalPages: 1, totalElements: 1, size: 50, number: 0 },
    },
  };

  it('shows the answers and the scans the api returned', async () => {
    answerApi(goodAnswers);
    renderWithProviders(<HomeScreen />);

    expect((await screen.findAllByText('Chicken salad')).length).toBeGreaterThan(0); // last scan and recent scans
    expect(screen.getByText('420')).toBeTruthy(); // calories today
    expect(screen.getByText('31g')).toBeTruthy(); // protein today
    expect(screen.getByText('Build Muscle')).toBeTruthy(); // goal answered during onboarding
    expect(screen.getByText('Beginner')).toBeTruthy(); // fitness level
    expect(screen.getByText(/^\d+ years$/)).toBeTruthy(); // age, with its number filled in
    expect(screen.queryByText(/\{\{/)).toBeNull(); // no unfilled placeholder anywhere
    expect(screen.getByText('7-8h')).toBeTruthy(); // sleep answer from the projection questions
    expect(mockApi.get).toHaveBeenCalledWith('/onboarding', expect.anything());
  });

  it('asks the api for everything and never calls the chat model on the way', async () => {
    answerApi(goodAnswers);
    renderWithProviders(<HomeScreen />);
    await screen.findAllByText('Chicken salad');
    expect(mockApi.post).not.toHaveBeenCalled(); // POST /chatbot/chat is the LLM call
  });

  it('marks the days that have scans in the week strip, and only those', async () => {
    answerApi(goodAnswers);
    renderWithProviders(<HomeScreen />);
    await screen.findAllByText('Chicken salad');

    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Scans: 1./ })).toHaveLength(1); // today
    expect(screen.getAllByRole('button', { name: /Scans: 0./ })).toHaveLength(6);
  });

  it('pull to refresh reloads the scans and still never calls the chat model', async () => {
    answerApi(goodAnswers);
    renderWithProviders(<HomeScreen />);
    await screen.findAllByText('Chicken salad');
    const before = mockApi.get.mock.calls.filter(([url]: [string]) => url === '/food-scans').length;

    await act(async () => {
      fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
    });
    await waitFor(() =>
      expect(mockApi.get.mock.calls.filter(([url]: [string]) => url === '/food-scans').length).toBe(
        before + 1
      )
    );
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('shows an error with a retry, not empty numbers, when nothing could be loaded', async () => {
    const down = networkError();
    answerApi({ '/onboarding': down, '/onboarding/projection': down, '/food-scans': down });
    renderWithProviders(<HomeScreen />);

    expect(await screen.findByText('Try again')).toBeTruthy();
    expect(screen.queryByText('Calories Today')).toBeNull();
  });

  it('recovers when the retry works', async () => {
    const down = networkError();
    answerApi({ '/onboarding': down, '/onboarding/projection': down, '/food-scans': down });
    renderWithProviders(<HomeScreen />);
    const retryButton = await screen.findByText('Try again');

    answerApi(goodAnswers); // the connection is back
    fireEvent.press(retryButton);

    expect((await screen.findAllByText('Chicken salad')).length).toBeGreaterThan(0);
  });

  it('keeps showing what it has when only one request fails', async () => {
    answerApi({ ...goodAnswers, '/onboarding/projection': networkError() });
    renderWithProviders(<HomeScreen />);

    expect((await screen.findAllByText('Chicken salad')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Could not refresh. Tap to try again.')).toBeTruthy();
  });
});
