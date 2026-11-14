import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { logError } from './apiError';

/** Longest side, in pixels, of a photo we upload. Phones shoot 4000 px and up; the scan model reads far less. */
export const FOOD_SCAN_MAX_SIDE = 1280;
export const PROFILE_MAX_SIDE = 1024;
export const UPLOAD_QUALITY = 0.8;

/**
 * The size to resize to so the longest side is `maxSide`, keeping the shape; null when the image is
 * already small enough (it is then uploaded as it is, never enlarged).
 */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number
): { width: number; height: number } | null {
  if (!(width > 0) || !(height > 0)) return null;
  const longest = Math.max(width, height);
  if (longest <= maxSide) return null;
  const scale = maxSide / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Shrinks a photo before it is uploaded: a smaller upload on mobile data and less for the api and the
 * model to read. If anything goes wrong the original is returned, so a scan never fails because of it.
 */
export async function prepareImageForUpload(
  uri: string,
  maxSide: number = FOOD_SCAN_MAX_SIDE
): Promise<string> {
  try {
    const source = await ImageManipulator.manipulate(uri).renderAsync();
    const target = fitWithin(source.width, source.height, maxSide);
    if (!target) return uri;
    const resized = await ImageManipulator.manipulate(uri).resize(target).renderAsync();
    const saved = await resized.saveAsync({
      compress: UPLOAD_QUALITY,
      format: SaveFormat.JPEG,
    });
    return saved.uri;
  } catch (error) {
    logError('image.prepare', error);
    return uri;
  }
}
