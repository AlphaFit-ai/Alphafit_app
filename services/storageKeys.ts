/**
 * Keys under which the app stores things on the device.
 *
 * The auth keys keep the names that builds already installed on phones use, so a user who updates
 * the app stays signed in. WP-MOB-3 moves the token to expo-secure-store and migrates these.
 */
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_ID_KEY = 'userId';

/** Same keys as before so an update keeps the user's saved language and theme. */
export const LANGUAGE_STORAGE_KEY = 'user_language';
export const THEME_STORAGE_KEY = '@alphafit_ai_theme';
