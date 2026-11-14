import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React, { ReactNode } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { persistOptions, queryClient } from '../services/queryClient';
import { ThemePreference } from '../services/preferences';
import { ToastProvider } from '../src/ui/Toast';
import { DietProvider } from './DietContext';
import { OnboardingProvider } from './OnboardingContext';
import { ProjectionProvider } from './ProjectionContext';
import { ThemeProvider } from './ThemeContext';

interface AppProvidersProps {
  children: ReactNode;
  /** Theme saved on this device, read before the first render. */
  initialTheme?: ThemePreference | null;
}

/**
 * Every app-wide provider, mounted once by the root layout. No other layout or screen mounts a
 * provider: a second copy would shadow this one, so a screen outside the nested layout would read a
 * different (empty) copy of the data.
 *
 * The query client holds all server data and is saved on the device; `signOut()` empties it.
 */
export function AppProviders({ children, initialTheme = null }: AppProvidersProps) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider initialTheme={initialTheme}>
        <KeyboardProvider>
          <ToastProvider>
            <OnboardingProvider>
              <DietProvider>
                <ProjectionProvider>{children}</ProjectionProvider>
              </DietProvider>
            </OnboardingProvider>
          </ToastProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
