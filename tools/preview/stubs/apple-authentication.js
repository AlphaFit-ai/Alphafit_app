export const isAvailableAsync = async () => false;
export const signInAsync = async () => {
  throw Object.assign(new Error('preview'), { code: 'ERR_CANCELED' });
};
export const AppleAuthenticationScope = { FULL_NAME: 0, EMAIL: 1 };
