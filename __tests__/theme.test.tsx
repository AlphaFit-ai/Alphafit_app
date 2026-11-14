import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { isThemePreference } from '../services/preferences';
import { darkTokens, lightTokens } from '../src/theme/tokens';

const mockColorScheme = jest.fn<'light' | 'dark' | null, []>(() => 'light');
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

const mockPush = jest.fn();
jest.mock('../services/preferences', () => ({
  ...jest.requireActual('../services/preferences'),
  pushPreferencesToServer: (...args: unknown[]) => mockPush(...args),
  storeTheme: jest.fn(() => Promise.resolve()),
}));

let latest!: ReturnType<typeof useTheme>;
function Probe() {
  latest = useTheme();
  return <Text>{latest.isDarkMode ? 'dark' : 'light'}</Text>;
}

beforeEach(() => {
  mockPush.mockReset();
  mockColorScheme.mockReturnValue('light');
});

describe('theme preference', () => {
  it('follows the phone when nothing is chosen, and tokens match', () => {
    mockColorScheme.mockReturnValue('dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByText('dark')).toBeTruthy();
    expect(latest.preference).toBe('system');
    expect(latest.tokens).toBe(darkTokens);
  });

  it('a fixed choice wins over the phone', () => {
    mockColorScheme.mockReturnValue('dark');
    render(
      <ThemeProvider initialTheme="light">
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByText('light')).toBeTruthy();
    expect(latest.tokens).toBe(lightTokens);
  });

  it('only the real themes are sent to the server, `system` stays on the phone', () => {
    render(
      <ThemeProvider initialTheme="light">
        <Probe />
      </ThemeProvider>
    );
    act(() => latest.setTheme('dark'));
    expect(mockPush).toHaveBeenCalledWith({ theme: 'dark' });
    mockPush.mockClear();
    act(() => latest.setTheme('system'));
    expect(mockPush).not.toHaveBeenCalled();
    act(() => latest.setTheme('light', { sync: false }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('accepts system as a saved value but rejects anything else', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('blue')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});
