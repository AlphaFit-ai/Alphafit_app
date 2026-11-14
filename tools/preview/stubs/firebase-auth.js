// A signed-in Firebase user for the preview: no network, no real account.
const user = {
  uid: 'preview-user',
  email: 'ann@example.com',
  providerData: [{ providerId: 'password' }],
  getIdToken: async () => 'preview-firebase-id-token',
};
// Signed out when the preview sets this flag in localStorage (and after signOut).
const FLAG = 'preview-firebase-signed-out';
const auth = {
  get currentUser() {
    return localStorage.getItem(FLAG) ? null : user;
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
export const signInWithCredential = async () => ({ user });
export const signInWithEmailAndPassword = async () => ({ user });
export const createUserWithEmailAndPassword = async () => ({ user });
export const sendPasswordResetEmail = async () => {};
export const updateProfile = async () => {};
export const signOut = async () => {
  localStorage.setItem(FLAG, '1');
};
