import { fitWithin, prepareImageForUpload, UPLOAD_QUALITY } from '../services/imagePrep';

const mockRender = jest.fn();
const mockSave = jest.fn();
const mockResize = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: (...args: unknown[]) => {
        mockResize(...args);
        return { renderAsync: async () => ({ saveAsync: mockSave }) };
      },
      renderAsync: () => mockRender(),
    })),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('fitWithin', () => {
  it('scales the longest side down to the limit and keeps the shape', () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });

  it('never enlarges, and leaves a small image alone', () => {
    expect(fitWithin(1280, 800, 1280)).toBeNull();
    expect(fitWithin(640, 480, 1280)).toBeNull();
  });

  it('ignores a size it cannot trust', () => {
    expect(fitWithin(0, 100, 1280)).toBeNull();
    expect(fitWithin(NaN, 100, 1280)).toBeNull();
  });
});

describe('prepareImageForUpload', () => {
  it('resizes a big photo to JPEG at the upload quality and returns the new file', async () => {
    mockRender.mockResolvedValue({ width: 4032, height: 3024 });
    mockSave.mockResolvedValue({ uri: 'file:///small.jpg' });

    await expect(prepareImageForUpload('file:///big.heic')).resolves.toBe('file:///small.jpg');
    expect(mockResize).toHaveBeenCalledWith({ width: 1280, height: 960 });
    expect(mockSave).toHaveBeenCalledWith({ compress: UPLOAD_QUALITY, format: 'jpeg' });
  });

  it('uploads a photo that is already small as it is', async () => {
    mockRender.mockResolvedValue({ width: 800, height: 600 });
    await expect(prepareImageForUpload('file:///ok.jpg')).resolves.toBe('file:///ok.jpg');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('falls back to the original when resizing fails, so the scan still goes ahead', async () => {
    mockRender.mockRejectedValue(new Error('decoder failed'));
    await expect(prepareImageForUpload('file:///x.jpg')).resolves.toBe('file:///x.jpg');
  });
});
