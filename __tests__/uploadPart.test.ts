import { toUploadPart, typeFromUri } from '../services/uploadPart';

/**
 * The image part of a multipart upload. On a phone React Native reads the file from `{uri,name,type}`;
 * a browser cannot, so the web preview sends the bytes as a Blob with a file name. A bug here is a
 * failed scan in the browser preview (the api answers 400 "File is required").
 */
const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

function fakeFetch(blob: { type: string; size: number }) {
  const mock = jest.fn(async () => ({ blob: async () => blob }));
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

describe('on a phone', () => {
  it('keeps the {uri, name, type} part React Native expects, named after the file', async () => {
    const part = await toUploadPart('file:///cache/ImagePicker/abc.png', 'food', 'android');
    expect(part).toEqual({
      kind: 'native',
      value: { uri: 'file:///cache/ImagePicker/abc.png', name: 'abc.png', type: 'image/png' },
    });
  });

  it('calls a .jpg a JPEG and an unnamed file a JPEG', async () => {
    expect(typeFromUri('file:///x/photo.JPG')).toBe('image/jpeg');
    expect(typeFromUri('file:///x/photo')).toBe('image/jpeg');
    expect(typeFromUri('file:///x/photo.webp?v=1')).toBe('image/webp');
  });

  it('reads nothing over the network', async () => {
    const mock = fakeFetch({ type: 'image/png', size: 1 });
    await toUploadPart('file:///x.jpg', 'food', 'ios');
    expect(mock).not.toHaveBeenCalled();
  });
});

describe('in the browser', () => {
  it('reads the picked or resized image into a Blob and names it after its real type', async () => {
    const blob = { type: 'image/png', size: 2048 };
    const mock = fakeFetch(blob);
    const part = await toUploadPart('blob:http://localhost:8184/0f1e', 'food', 'web');
    expect(mock).toHaveBeenCalledWith('blob:http://localhost:8184/0f1e');
    expect(part).toEqual({ kind: 'web', value: blob, name: 'food.png', type: 'image/png' });
  });

  it('names a JPEG .jpg, a WebP .webp, and treats an untyped blob as JPEG', async () => {
    fakeFetch({ type: 'image/jpeg', size: 1 });
    expect(await toUploadPart('blob:x', 'profile', 'web')).toMatchObject({ name: 'profile.jpg' });
    fakeFetch({ type: 'image/webp', size: 1 });
    expect(await toUploadPart('blob:x', 'food', 'web')).toMatchObject({ name: 'food.webp' });
    fakeFetch({ type: '', size: 1 });
    expect(await toUploadPart('blob:x', 'food', 'web')).toMatchObject({
      name: 'food.jpg',
      type: 'image/jpeg',
    });
  });
});
