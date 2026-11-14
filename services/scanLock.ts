/**
 * A camera reports the same barcode many times per second while it stays in frame. The lock lets
 * the first report through and ignores the rest until the scanner is opened again, so one scan is
 * one lookup.
 */
export interface ScanLock {
  /** True for the first call after `reset()`; false for every call after that. */
  tryLock(): boolean;
  reset(): void;
  readonly locked: boolean;
}

export function createScanLock(): ScanLock {
  let locked = false;
  return {
    tryLock() {
      if (locked) return false;
      locked = true;
      return true;
    },
    reset() {
      locked = false;
    },
    get locked() {
      return locked;
    },
  };
}
