import { type Href, useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Moving between two screens of one stack that link to each other (Login's "Sign up" and Register's
 * "Sign in"): when the other screen is right below in the stack, go back to it; otherwise open it
 * (`push` from Login, `replace` from Register). Going back and forth then never piles up copies of the
 * two screens (it used to: Register's link stacked a second Login on top), and Android back behaves.
 */
export function useSwitchTo() {
  const router = useRouter();
  const navigation = useNavigation();
  return useCallback(
    (routeName: string, href: Href, open: 'push' | 'replace') => {
      const state = navigation.getState();
      const below = state && state.index > 0 ? state.routes[state.index - 1]?.name : undefined;
      if (below === routeName) router.back();
      else if (open === 'push') router.push(href);
      else router.replace(href);
    },
    [navigation, router]
  );
}
