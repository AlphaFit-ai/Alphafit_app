// Stand-in for firebase/auth in the dev-only web preview: no network, no real account.
//
// Two modes, chosen when the preview is built:
//  - mock (screenshots and flows against tools/preview/mock-api.js): somebody is signed in unless the
//    page set the "signed out" flag, and the ID token is a fixed string the mock accepts.
//  - token (EXPO_PUBLIC_PREVIEW_AUTH=token, `npm run preview:serve` against the real local api): nobody
//    is signed in until /dev-sign-in stored a user (docs/CONTRACTS.md section 8). There is no Firebase
//    session behind it, so the token cannot be renewed: when the api token expires the app signs out.
const TOKEN_MODE = process.env.EXPO_PUBLIC_PREVIEW_AUTH === 'token';

// Signed out when the preview sets this flag in localStorage (and after signOut). Mock mode.
const FLAG = 'preview-firebase-signed-out';
// The user /dev-sign-in signed in, as JSON {uid, email}. Token mode.
const DEV_USER = 'preview-dev-user';

const mockUser = {
  uid: 'preview-user',
  email: 'ann@example.com',
  providerData: [{ providerId: 'password' }],
  getIdToken: async () => 'preview-firebase-id-token',
};

function devUser() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(DEV_USER) || 'null');
  } catch {
    saved = null;
  }
  if (!saved || typeof saved.uid !== 'string') return null;
  return {
    uid: saved.uid,
    email: saved.email || null,
    providerData: [{ providerId: 'password' }],
    // The app reads this as "the Firebase session is gone" and signs out instead of retrying.
    getIdToken: async () => {
      throw Object.assign(new Error('The preview token cannot be renewed'), {
        code: 'auth/user-token-expired',
      });
    },
  };
}

const auth = {
  get currentUser() {
    if (TOKEN_MODE) return devUser();
    return localStorage.getItem(FLAG) ? null : mockUser;
  },
  authStateReady: async () => {},
};

/** Preview only: called by /dev-sign-in (src/preview) to say who is signed in, or null for nobody. */
export const __previewSetUser = (user) => {
  if (user) localStorage.setItem(DEV_USER, JSON.stringify({ uid: user.uid, email: user.email }));
  else localStorage.removeItem(DEV_USER);
};

export const getAuth = () => auth;
export const initializeAuth = () => auth;
export const getReactNativePersistence = () => undefined;
export const GoogleAuthProvider = { credential: () => ({}) };
export class OAuthProvider {
  credential() {
    return {};
  }
}
const refuse = async () => {
  // Email, Google and Apple sign-in need Firebase, which the preview does not have.
  throw Object.assign(new Error('Sign-in is not available in the preview'), {
    code: 'auth/operation-not-allowed',
  });
};
export const signInWithCredential = TOKEN_MODE ? refuse : async () => ({ user: mockUser });
export const signInWithEmailAndPassword = TOKEN_MODE ? refuse : async () => ({ user: mockUser });
export const createUserWithEmailAndPassword = TOKEN_MODE
  ? refuse
  : async () => ({ user: mockUser });
export const sendPasswordResetEmail = async () => {};
export const updateProfile = async () => {};
export const signOut = async () => {
  if (TOKEN_MODE) localStorage.removeItem(DEV_USER);
  else localStorage.setItem(FLAG, '1');
};
