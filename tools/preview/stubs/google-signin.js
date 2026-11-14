export const GoogleSignin = {
  configure() {},
  hasPlayServices: async () => true,
  hasPreviousSignIn: () => false,
  signIn: async () => ({ data: null }),
  signOut: async () => {},
};
