// Stand-in for firebase/auth in the dev-only web harness (screenshots and flows against
// tools/preview/mock-api.js): no network, no real account. Somebody is signed in unless the page set the
// "signed out" flag, and the ID token is a fixed string the mock accepts.

// Signed out when the harness sets this flag in localStorage (and after signOut).
const FLAG = 'preview-firebase-signed-out';

const mockUser = {
  uid: 'preview-user',
  email: 'ann@example.com',
  providerData: [{ providerId: 'password' }],
  getIdToken: async () => 'preview-firebase-id-token',
};

const auth = {
  get currentUser() {
    return localStorage.getItem(FLAG) ? null : mockUser;
  },
  authStateReady: async () => {},
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
export const signInWithCredential = async () => ({ user: mockUser });
export const signInWithEmailAndPassword = async () => ({ user: mockUser });
export const createUserWithEmailAndPassword = async () => ({ user: mockUser });
export const sendPasswordResetEmail = async () => {};
export const updateProfile = async () => {};
export const signOut = async () => {
  localStorage.setItem(FLAG, '1');
};
