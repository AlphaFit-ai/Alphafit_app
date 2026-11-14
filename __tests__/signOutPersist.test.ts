import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClientSubscribe } from '@tanstack/react-query-persist-client';
import { clearQueryCache, PERSIST_KEY, persistOptions, queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';

/**
 * Sign-out removes the saved copy of the cache from the device. The persister (subscribed by the app's
 * provider) takes a copy on every cache change and writes it asynchronously, throttled to once a second.
 * A copy taken while the wipe was resetting the queries still held the other answers of the user who
 * signed out, and its write landed after the removal: the previous user's onboarding answers stayed on
 * the device until the next write, or for good if the app was closed in that second.
 *
 * Its own test file on purpose: a fresh module means a fresh persister that is not waiting out its
 * throttle, which is the state in which the late write happened (a slow phone, or a quiet second before
 * the user taps Log out).
 */
const persist = {
  queryClient,
  persister: persistOptions.persister,
  buster: persistOptions.buster,
  dehydrateOptions: persistOptions.dehydrateOptions,
};

it('leaves none of the previous user answers on the device, also from a copy taken mid-wipe', async () => {
  const writes: string[] = [];
  const realSetItem = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  let nextWrite: () => void = () => undefined;
  jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key: string, value: string) => {
    await realSetItem(key, value);
    if (key === PERSIST_KEY) {
      writes.push(value);
      nextWrite();
    }
  });

  queryClient.setQueryData(queryKeys.profile, { fullName: 'First user' });
  queryClient.setQueryData(queryKeys.onboarding, { goal: 'first-user-goal' });
  queryClient.setQueryData(queryKeys.avatar, 'https://img.example/first.jpg');
  const unsubscribe = persistQueryClientSubscribe(persist);

  await clearQueryCache();
  const onDevice = await AsyncStorage.getItem(PERSIST_KEY);
  expect(onDevice ?? '').not.toMatch(/first/i);

  // And the throttled write that follows (within a second) carries nothing of that user either.
  await new Promise<void>((resolve) => (nextWrite = resolve));
  expect(writes.join('\n')).not.toMatch(/first/i);
  expect(JSON.parse(writes[writes.length - 1]).clientState.queries).toEqual([]);
  unsubscribe();
});
