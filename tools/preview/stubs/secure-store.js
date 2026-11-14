// In-memory stand-in (the real module has no web implementation).
const store = new Map();
export const getItemAsync = async (k) => (store.has(k) ? store.get(k) : null);
export const setItemAsync = async (k, v) => void store.set(k, v);
export const deleteItemAsync = async (k) => void store.delete(k);
