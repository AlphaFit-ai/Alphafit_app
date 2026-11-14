import { Redirect } from 'expo-router';

/**
 * The fallback of the onboarding folder: when a guard turns a user away from one of its screens, they
 * land here and `/` sends them where they belong (Home, or the question they stopped at).
 */
export default function OnboardingIndex() {
  return <Redirect href="/" />;
}
