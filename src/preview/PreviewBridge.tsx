import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { profileQuery } from '../../hooks/queries';
import { signOut } from '../../services/session';
import { useSession } from '../../services/sessionStore';

/** What the page around the app (tools/preview/shell) may ask the app to do. */
export interface PreviewControls {
  setTheme: (theme: 'light' | 'dark') => void;
  signOut: () => Promise<void>;
}

/** What the app tells the page around it, so its dev bar can show it. */
export interface PreviewState {
  source: 'alphafit-preview';
  theme: 'light' | 'dark';
  status: string;
  name: string | null;
  email: string | null;
}

type PreviewWindow = Window & { __alphafitPreview?: PreviewControls };

/**
 * Connects the app to the dev bar of the browser preview (`npm run preview:serve` shows the app in a
 * phone-sized frame with a small bar outside it). The bar can switch the theme and sign out; the app
 * reports its theme and who is signed in. Mounted by the root layout in preview builds only; it draws
 * nothing.
 */
export default function PreviewBridge() {
  const { isDarkMode, setTheme } = useTheme();
  const session = useSession();
  const router = useRouter();
  const signedIn = session.status === 'ready' || session.status === 'onboarding';
  const profile = useQuery({ ...profileQuery, enabled: signedIn });
  const name = signedIn ? (profile.data?.fullName ?? null) : null;
  const email = signedIn ? (profile.data?.email ?? null) : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = window as PreviewWindow;
    target.__alphafitPreview = {
      // A display choice of the person looking at the preview: not written to the account.
      setTheme: (theme) => setTheme(theme, { sync: false }),
      signOut: async () => {
        await signOut();
        router.replace('/');
      },
    };
    return () => {
      delete target.__alphafitPreview;
    };
  }, [setTheme, router]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.parent || window.parent === window) return;
    const state: PreviewState = {
      source: 'alphafit-preview',
      theme: isDarkMode ? 'dark' : 'light',
      status: session.status,
      name,
      email,
    };
    window.parent.postMessage(state, window.location.origin);
  }, [isDarkMode, session.status, name, email]);

  return null;
}
