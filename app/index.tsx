import { type Href, Redirect } from 'expo-router';
import { entryRoute, useSession } from '../services/sessionStore';

/**
 * The entry point. Every way into the app (launch, after sign-in, after sign-out, a route a guard
 * turned away) comes back here, and the session decides where to go.
 */
export default function Index() {
  const session = useSession();
  return <Redirect href={entryRoute(session) as Href} />;
}
