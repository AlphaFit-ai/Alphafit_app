import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import TabsLayout from '../app/(tabs)/_layout';
import ScanRoute from '../app/(tabs)/scan';
import { AppProviders } from '../context/AppProviders';
import { useDiet } from '../context/DietContext';
import '../i18n/config';
import { queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';
import { scanEntryStep, SCAN_STEP } from '../src/scan/openScan';
import { darkTokens, lightTokens } from '../src/theme/tokens';
import { haptic } from '../src/ui/haptics';

/**
 * The centre of the tab bar is the app's main action: a coral button that opens the food scan, or the
 * diet questions first when they are not finished (they end on the scan).
 */
type Options = {
  href?: unknown;
  tabBarButton?: (props: { style?: object }) => React.ReactElement;
};
const mockScreens: { name: string; options: Options }[] = [];
const mockNavigate = jest.fn();
jest.mock('expo-router', () => {
  const { View: V } = jest.requireActual('react-native');
  const { createElement } = jest.requireActual('react');
  function Tabs({ children }: { children: React.ReactNode }) {
    return createElement(V, null, children);
  }
  function Screen({ name, options }: { name: string; options: Options }) {
    mockScreens.push({ name, options });
    return null;
  }
  Tabs.Screen = Screen;
  // Called through a wrapper: the factory runs before `mockNavigate` is initialised.
  const router = {
    navigate: (...args: unknown[]) => mockNavigate(...args),
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };
  return { Tabs, useRouter: () => router };
});
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(() => new Promise(() => {})), post: jest.fn(), put: jest.fn() },
}));

const COMPLETE = {
  dietPreference: 'flexible',
  hasAllergies: false,
  mealsPerDay: 3,
  takesSupplements: false,
};

function Step() {
  const { currentStep, setCurrentStep } = useDiet();
  return (
    <Text testID="step" onPress={() => setCurrentStep(5)}>
      {String(currentStep)}
    </Text>
  );
}

/** Renders the tab layout, then the centre button it declares, next to a probe of the Diet step. */
function openTabBar(theme: 'light' | 'dark' = 'light') {
  mockScreens.length = 0;
  render(
    <AppProviders initialTheme={theme}>
      <TabsLayout />
    </AppProviders>
  );
  const scan = mockScreens.find((s) => s.name === 'scan')!;
  screen.unmount();
  render(
    <AppProviders initialTheme={theme}>
      {scan.options.tabBarButton!({ style: { flex: 1 } })}
      <Step />
    </AppProviders>
  );
  return screen.getByRole('button', { name: 'Scan food' });
}

beforeEach(() => {
  mockNavigate.mockClear();
  queryClient.clear();
});

describe('scanEntryStep', () => {
  it('is the scan once every diet question is answered', () => {
    expect(scanEntryStep(COMPLETE as never)).toBe(SCAN_STEP);
  });

  it('is the first unanswered question otherwise, and the first question when nothing is saved', () => {
    expect(scanEntryStep({ ...COMPLETE, mealsPerDay: undefined } as never)).toBe(2);
    expect(scanEntryStep(null)).toBe(0);
  });

  it('leaves the choice to the Diet tab while the answers are not loaded', () => {
    expect(scanEntryStep(undefined)).toBeUndefined();
  });
});

describe('the centre tab-bar button', () => {
  it('sits in the middle of the five visible tabs', () => {
    mockScreens.length = 0;
    render(
      <AppProviders>
        <TabsLayout />
      </AppProviders>
    );
    const visible = mockScreens.filter((s) => s.options.href !== null).map((s) => s.name);
    expect(visible).toEqual(['home', 'workouts', 'scan', 'diet', 'profile']);
  });

  it('opens the scan in the Diet tab, with a haptic tick, when the diet setup is done', () => {
    const tick = jest.spyOn(haptic, 'select');
    queryClient.setQueryData(queryKeys.diet, COMPLETE);
    const button = openTabBar();
    fireEvent.press(button);
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/diet');
    expect(screen.getByTestId('step').props.children).toBe(String(SCAN_STEP));
    expect(tick).toHaveBeenCalledTimes(1);
    tick.mockRestore();
  });

  it('opens the first unanswered diet question when the setup is not finished', () => {
    queryClient.setQueryData(queryKeys.diet, { dietPreference: 'vegan', hasAllergies: false });
    fireEvent.press(openTabBar());
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/diet');
    expect(screen.getByTestId('step').props.children).toBe('2');
  });

  it('goes back to a fresh scan from an old result', () => {
    queryClient.setQueryData(queryKeys.diet, COMPLETE);
    const button = openTabBar();
    fireEvent.press(screen.getByTestId('step')); // the Diet tab shows a scan result (step 5)
    expect(screen.getByTestId('step').props.children).toBe('5');
    fireEvent.press(button);
    expect(screen.getByTestId('step').props.children).toBe(String(SCAN_STEP));
  });

  it('still opens the Diet tab when the answers are not loaded (it positions itself)', () => {
    fireEvent.press(openTabBar());
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/diet');
    expect(screen.getByTestId('step').props.children).toBe('0');
  });

  it('is a labelled button of at least 44 pt, coral with a navy icon, in both themes', () => {
    for (const [theme, tokens] of [
      ['light', lightTokens],
      ['dark', darkTokens],
    ] as const) {
      const button = openTabBar(theme);
      expect(button.props.accessibilityHint).toBe('Opens the food scan');
      const style = StyleSheet.flatten(button.props.style);
      expect(style.width).toBeGreaterThanOrEqual(44);
      expect(style.height).toBeGreaterThanOrEqual(44);
      expect(style.backgroundColor).toBe(tokens.color.accent);
      expect(style.borderColor).toBe(tokens.color.bg);
      const icon = screen.UNSAFE_getByProps({ name: 'scan' });
      expect(icon.props.color).toBe(tokens.color.onAccent);
      screen.unmount();
    }
  });

  it('a link to /scan lands on the scan too, without a haptic', async () => {
    const tick = jest.spyOn(haptic, 'select');
    queryClient.setQueryData(queryKeys.diet, COMPLETE);
    render(
      <AppProviders>
        <ScanRoute />
        <Step />
      </AppProviders>
    );
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/diet');
    expect(screen.getByTestId('step').props.children).toBe(String(SCAN_STEP));
    expect(tick).not.toHaveBeenCalled();
    tick.mockRestore();
  });
});
