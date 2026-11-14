// Stand-in for expo-secure-store in the dev-only web preview (the real module has no web
// implementation). It keeps values in localStorage so a page reload keeps the session; that is fine
// here because the preview only ever holds a throwaway token for the local stack.
const PREFIX = 'preview-secure:';
const memory = new Map();

const storage = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // storage blocked: fall back to memory
  }
};

export const getItemAsync = async (key) => {
  const s = storage();
  if (s) return s.getItem(PREFIX + key);
  return memory.has(key) ? memory.get(key) : null;
};
export const setItemAsync = async (key, value) => {
  const s = storage();
  if (s) s.setItem(PREFIX + key, value);
  else memory.set(key, value);
};
export const deleteItemAsync = async (key) => {
  const s = storage();
  if (s) s.removeItem(PREFIX + key);
  else memory.delete(key);
};
