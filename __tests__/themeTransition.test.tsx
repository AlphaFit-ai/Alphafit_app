import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import {
  originOf,
  REVEAL_MS,
  revealRadius,
  ThemeTransitionProvider,
  useThemeTransition,
} from '../src/ui/ThemeTransition';

/**
 * The light/dark switch the user makes: a snapshot of the screen, the theme switched underneath one
 * frame later, and a circle growing from the pressed button over REVEAL_MS, then the overlay is removed.
 */
let mockReduce = false;
jest.mock('../src/ui/motion', () => ({
  ...jest.requireActual('../src/ui/motion'),
  useReduceMotion: () => mockReduce,
}));

const ORIGIN = { x: 40, y: 60 };

function Probe() {
  const { isDarkMode, preference } = useTheme();
  const { toggleTheme, setThemeFrom } = useThemeTransition();
  return (
    <>
      <Text testID="mode">{isDarkMode ? 'dark' : 'light'}</Text>
      <Text testID="preference">{preference}</Text>
      <Text onPress={() => toggleTheme(ORIGIN)}>Toggle</Text>
      <Text onPress={() => toggleTheme()}>Toggle without origin</Text>
      <Text onPress={() => setThemeFrom('light', ORIGIN)}>Choose light</Text>
    </>
  );
}

function open(snapshot: jest.Mock) {
  render(
    <ThemeProvider initialTheme="light">
      <ThemeTransitionProvider snapshot={snapshot}>
        <Probe />
      </ThemeTransitionProvider>
    </ThemeProvider>
  );
}

const mode = () => screen.getByTestId('mode').props.children;
const overlay = () => screen.queryByTestId('theme-reveal');
const flush = () => act(async () => {});
/** The snapshot is drawn for one frame before anything under it changes. */
const nextFrame = () => act(() => jest.advanceTimersByTime(20));

beforeEach(() => {
  mockReduce = false;
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

it('reveals the new theme from the button: snapshot, switch underneath, then the overlay goes', async () => {
  const image = { dispose: jest.fn() };
  const snapshot = jest.fn(async () => image);
  open(snapshot);
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  expect(snapshot).toHaveBeenCalledTimes(1);
  expect(overlay()).toBeTruthy(); // the old screen is on top
  expect(mode()).toBe('light'); // drawn for a frame first
  nextFrame();
  expect(mode()).toBe('dark'); // then the new theme is underneath
  act(() => jest.advanceTimersByTime(REVEAL_MS + 50));
  expect(overlay()).toBeNull();
  expect(image.dispose).toHaveBeenCalled();
});

it('ignores a second tap while the circle grows, and works again afterwards', async () => {
  const snapshot = jest.fn(async () => ({ dispose: jest.fn() }));
  open(snapshot);
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  nextFrame();
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  expect(snapshot).toHaveBeenCalledTimes(1);
  expect(mode()).toBe('dark');
  act(() => jest.advanceTimersByTime(REVEAL_MS + 50));
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  nextFrame();
  expect(snapshot).toHaveBeenCalledTimes(2);
  expect(mode()).toBe('light');
  act(() => jest.advanceTimersByTime(REVEAL_MS + 50));
  expect(overlay()).toBeNull();
});

it('with reduced motion: no snapshot, no circle, the theme switches at once', async () => {
  mockReduce = true;
  const snapshot = jest.fn();
  open(snapshot);
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  expect(snapshot).not.toHaveBeenCalled();
  expect(overlay()).toBeNull();
  expect(mode()).toBe('dark');
});

it('a snapshot that fails still switches the theme, logs it, and leaves nothing on screen', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const snapshot = jest.fn(async () => {
    throw new Error('no view');
  });
  open(snapshot);
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  expect(mode()).toBe('dark');
  expect(overlay()).toBeNull();
  expect(String(consoleError.mock.calls[0][0])).toMatch(/themeTransition\.snapshot/);
  // Not stuck: the next tap works.
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  expect(mode()).toBe('light');
  consoleError.mockRestore();
});

it('a snapshot that returns nothing switches at once', async () => {
  open(jest.fn(async () => null));
  fireEvent.press(screen.getByText('Toggle'));
  await flush();
  expect(mode()).toBe('dark');
  expect(overlay()).toBeNull();
});

it('without a press position, or for a choice that keeps light/dark, it just switches', async () => {
  const snapshot = jest.fn(async () => null);
  open(snapshot);
  fireEvent.press(screen.getByText('Toggle without origin'));
  await flush();
  expect(mode()).toBe('dark');
  fireEvent.press(screen.getByText('Choose light'));
  await flush();
  expect(mode()).toBe('light');
  expect(snapshot).toHaveBeenCalledTimes(1); // only "Choose light" changed light/dark with an origin
});

it('the circle ends at the farthest corner, so it always covers the screen', () => {
  expect(revealRadius({ x: 0, y: 0 }, 300, 400)).toBe(500);
  expect(revealRadius({ x: 150, y: 200 }, 300, 400)).toBe(250);
});

describe('every theme control uses it, from the press position', () => {
  const fs = jest.requireActual('fs') as typeof import('fs');
  const path = jest.requireActual('path') as typeof import('path');
  const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

  it('reads the press position from the event', () => {
    expect(originOf({ nativeEvent: { pageX: 12, pageY: 34 } } as never)).toEqual({ x: 12, y: 34 });
    expect(originOf(undefined)).toBeUndefined();
  });

  it('Login and Settings switch through the reveal, not straight through the context', () => {
    expect(read('app/onboarding/login.tsx')).toMatch(/toggleTheme\(originOf\(event\)\)/);
    expect(read('app/profile/settings.tsx')).toMatch(
      /setThemeFrom\(option\.value, originOf\(event\)\)/
    );
  });
});
