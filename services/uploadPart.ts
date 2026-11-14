import { Platform } from 'react-native';

/**
 * The `file` part of a multipart image upload.
 *
 * On a phone, React Native's FormData takes `{uri, name, type}` and reads the file itself. A browser
 * (the web preview) does not: it needs the bytes as a Blob with a file name, or the request carries a
 * useless "[object Object]" field. On the web the picked or resized image (a `blob:` URL) is read into
 * a Blob first.
 *
 * The api accepts JPEG, PNG and WebP (`ImageService.ALLOWED_CONTENT_TYPES`), and stores the object under
 * the extension of the type, so the name and the type must agree.
 */
export type UploadPart =
  | { kind: 'native'; value: { uri: string; name: string; type: string } }
  | { kind: 'web'; value: Blob; name: string; type: string };

const EXTENSION_FOR_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** `image/<ext>` from the last path segment of a file URI, JPEG when it has no extension. */
export function typeFromUri(uri: string): string {
  const last = uri.split('?')[0].split('/').pop() ?? '';
  const match = /\.(\w+)$/.exec(last);
  if (!match) return 'image/jpeg';
  const ext = match[1].toLowerCase();
  return ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
}

/**
 * @param uri      a `file://` URI on a phone, a `blob:` or `data:` URL in the browser
 * @param baseName the name to send without extension ("food", "profile"); on a phone the URI's own file
 *                 name is kept, as before
 */
export async function toUploadPart(
  uri: string,
  baseName: string,
  platform: string = Platform.OS
): Promise<UploadPart> {
  if (platform !== 'web') {
    const name = uri.split('/').pop() || `${baseName}.jpg`;
    return { kind: 'native', value: { uri, name, type: typeFromUri(name) } };
  }
  const response = await fetch(uri);
  const blob = await response.blob();
  const type = (blob.type || 'image/jpeg').toLowerCase();
  const ext = EXTENSION_FOR_TYPE[type] ?? (type.startsWith('image/') ? type.slice(6) : 'jpg');
  return { kind: 'web', value: blob, name: `${baseName}.${ext}`, type };
}

/** A FormData with the image as its `file` field. */
export async function imageFormData(uri: string, baseName: string): Promise<FormData> {
  const part = await toUploadPart(uri, baseName);
  const form = new FormData();
  if (part.kind === 'web') {
    form.append('file', part.value, part.name);
  } else {
    // React Native's FormData reads the file from the URI.
    form.append('file', part.value as unknown as Blob);
  }
  return form;
}
