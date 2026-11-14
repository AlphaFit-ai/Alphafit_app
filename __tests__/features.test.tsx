import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import TabsLayout from '../app/(tabs)/_layout';
import FAQScreen from '../app/profile/faq';
import IntroScreen from '../app/onboarding/intro';
import { ProPlanModal } from '../components/ProPlanModal';
import { FEATURES } from '../constants';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';

const mockScreens: Record<string, { href?: unknown }> = {};
jest.mock('expo-router', () => {
  const { View: V } = jest.requireActual('react-native');
  const { createElement } = jest.requireActual('react');
  function Tabs({ children }: { children: React.ReactNode }) {
    return createElement(V, null, children);
  }
  function Screen({ name, options }: { name: string; options: { href?: unknown } }) {
    mockScreens[name] = options;
    return null;
  }
  Tabs.Screen = Screen;
  return {
    Tabs,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: () => true,
    }),
  };
});
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: {} })), post: jest.fn(), put: jest.fn() },
}));

const withProviders = (ui: React.ReactElement) => render(<AppProviders>{ui}</AppProviders>);

describe('feature flag: projections (ROADMAP D2)', () => {
  it('is off by default', () => {
    expect(FEATURES.projections).toBe(false);
  });

  it('removes the Projections tab from the tab bar but keeps the other four', () => {
    withProviders(<TabsLayout />);
    // `href: null` is how expo-router hides a tab and keeps its route.
    expect(mockScreens.projections.href).toBeNull();
    for (const name of ['home', 'workouts', 'diet', 'profile']) {
      expect(mockScreens[name]).toBeDefined();
      expect(mockScreens[name].href).toBeUndefined();
    }
  });

  it('the intro shows no mock physique scores and describes what the app does today', () => {
    withProviders(<IntroScreen />);
    expect(screen.getByText('Eat smarter, train better')).toBeTruthy();
    expect(screen.queryByText('6.2')).toBeNull();
    expect(screen.queryByText('8.4')).toBeNull();
    expect(screen.queryByText(/Current/)).toBeNull();
    expect(screen.queryByText(/Physique Projection/i)).toBeNull();
  });

  it('the FAQ does not describe the physique projection', () => {
    withProviders(<FAQScreen />);
    expect(screen.getByText('How do I track my workouts?')).toBeTruthy();
    expect(screen.queryByText('How does the AI Physique Projection work?')).toBeNull();
  });

  it('the Pro plan does not list the physique projection, and its buy buttons stay disabled (D1)', () => {
    withProviders(
      <>
        <Text>host</Text>
        <ProPlanModal visible onClose={jest.fn()} />
      </>
    );
    expect(screen.queryByText(/physique projection/i)).toBeNull();
    expect(screen.getByText('Custom weekly workouts')).toBeTruthy();
    const trial = screen.getByRole('button', { name: /free trial/i });
    expect(trial.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(trial);
  });
});
