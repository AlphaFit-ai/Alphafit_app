import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { barcodeService, ProductNotFoundError } from '../services/barcodeService';
import { createScanLock } from '../services/scanLock';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('barcodeService.lookupBarcode', () => {
  it('encodes the scanned value in the URL', async () => {
    mockApi.get.mockResolvedValue({
      data: { success: true, data: { predictions: [{ food: 'Oats' }] } },
    });

    await barcodeService.lookupBarcode('abc/def?x=1 #2');

    const url = mockApi.get.mock.calls[0][0];
    expect(url).toBe('/barcodes/lookup/abc%2Fdef%3Fx%3D1%20%232');
    expect(url).not.toContain('?');
    expect(url.split('/')).toHaveLength(4); // /barcodes/lookup/<one segment>
  });

  it('leaves a normal EAN-13 as it is', async () => {
    mockApi.get.mockResolvedValue({ data: { success: true, data: {} } });
    await barcodeService.lookupBarcode('3017620422003');
    expect(mockApi.get.mock.calls[0][0]).toBe('/barcodes/lookup/3017620422003');
  });

  it('maps the api answer and fills the fields it does not send', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          scanId: 's1',
          predictions: [{ food: 'Oats', portionSize: '40 g', portionWeightG: 40, confidence: 1 }],
          totalNutrition: { calories: 372, protein: 13 },
          source: 'Open Food Facts',
        },
      },
    });

    const product = await barcodeService.lookupBarcode('123');

    expect(product.scan_id).toBe('s1');
    expect(product.predictions[0]).toEqual({
      food: 'Oats',
      confidence: 1,
      portion_size: '40 g',
      portion_weight_g: 40,
    });
    expect(product.total_nutrition).toEqual({
      calories: 372,
      protein: 13,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    });
    expect(product.source).toBe('Open Food Facts');
  });

  it('returns an empty prediction list instead of failing when the api sends none', async () => {
    mockApi.get.mockResolvedValue({ data: { success: true, data: { source: 'x' } } });
    const product = await barcodeService.lookupBarcode('123');
    expect(product.predictions).toEqual([]);
  });

  it('says "not found" for a 404 and for an empty answer', async () => {
    mockApi.get.mockRejectedValueOnce(
      new AxiosError(
        'x',
        'ERR_BAD_REQUEST',
        config,
        {},
        { status: 404, statusText: '', data: {}, headers: {}, config }
      )
    );
    await expect(barcodeService.lookupBarcode('1')).rejects.toBeInstanceOf(ProductNotFoundError);

    mockApi.get.mockResolvedValueOnce({ data: { success: false, data: null } });
    await expect(barcodeService.lookupBarcode('1')).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('passes any other failure on unchanged, so a dropped connection is not "product not found"', async () => {
    const offline = new AxiosError('Network Error', 'ERR_NETWORK', config, {});
    mockApi.get.mockRejectedValueOnce(offline);
    await expect(barcodeService.lookupBarcode('1')).rejects.toBe(offline);
  });
});

describe('scan lock', () => {
  it('lets the first report of a code through and ignores the rest, so one code is one lookup', async () => {
    const lock = createScanLock();
    const lookup = jest.fn();
    // The camera reports the same barcode ten times in a row.
    for (let i = 0; i < 10; i++) {
      if (lock.tryLock()) lookup('3017620422003');
    }
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('lets the next scanning session through after a reset', () => {
    const lock = createScanLock();
    expect(lock.tryLock()).toBe(true);
    expect(lock.tryLock()).toBe(false);
    expect(lock.locked).toBe(true);
    lock.reset();
    expect(lock.locked).toBe(false);
    expect(lock.tryLock()).toBe(true);
  });
});
