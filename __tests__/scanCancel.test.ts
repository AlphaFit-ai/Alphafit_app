import { normalizeApiError } from '../services/apiError';
import { abortableDelay, foodScanService } from '../services/foodScanService';

jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

const scanAnswer = (id: string, status: string) => ({
  data: { success: true, data: { id, status, predictions: [] } },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('abortableDelay', () => {
  it('waits, then resolves', async () => {
    await expect(abortableDelay(5)).resolves.toBeUndefined();
  });

  it('ends at once with a cancelled error when aborted, instead of waiting out the interval', async () => {
    const controller = new AbortController();
    const started = Date.now();
    const wait = abortableDelay(60_000, controller.signal);
    controller.abort();
    const failure = await wait.catch((e) => e);
    expect(normalizeApiError(failure).kind).toBe('cancelled');
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('does not even start when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(abortableDelay(10, controller.signal)).rejects.toMatchObject({
      code: 'ERR_CANCELED',
    });
  });
});

describe('scan polling', () => {
  it('polls a PENDING scan until it completes', async () => {
    mockApi.get
      .mockResolvedValueOnce(scanAnswer('s1', 'PENDING'))
      .mockResolvedValueOnce(scanAnswer('s1', 'PROCESSING'))
      .mockResolvedValueOnce(scanAnswer('s1', 'COMPLETED'));
    const scan = await foodScanService.pollForCompletion('s1', 10, 1);
    expect(scan.status).toBe('COMPLETED');
    expect(mockApi.get).toHaveBeenCalledTimes(3);
  });

  it('stops polling when cancelled: no further request after the abort, and a cancelled error comes back', async () => {
    mockApi.get.mockResolvedValue(scanAnswer('s1', 'PROCESSING'));
    const controller = new AbortController();

    const poll = foodScanService.pollForCompletion('s1', 30, 20, controller.signal);
    await new Promise((r) => setTimeout(r, 50)); // a couple of polls happen
    controller.abort();
    const failure = await poll.catch((e) => e);
    const callsAtAbort = mockApi.get.mock.calls.length;
    await new Promise((r) => setTimeout(r, 100));

    expect(normalizeApiError(failure).kind).toBe('cancelled');
    expect(mockApi.get.mock.calls.length).toBe(callsAtAbort); // the polling really stopped
    expect(callsAtAbort).toBeGreaterThan(0);
  });

  it('hands the signal to every request, so one in flight is cancelled too', async () => {
    mockApi.get.mockResolvedValue(scanAnswer('s1', 'COMPLETED'));
    const controller = new AbortController();
    await foodScanService.pollForCompletion('s1', 5, 1, controller.signal);
    expect(mockApi.get.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('scanFood passes the signal to creating the scan and to polling', async () => {
    mockApi.post.mockResolvedValue(scanAnswer('s9', 'PENDING'));
    mockApi.get.mockResolvedValue(scanAnswer('s9', 'COMPLETED'));
    const controller = new AbortController();
    await foodScanService.scanFood('https://x/img.jpg', undefined, controller.signal);
    expect(mockApi.post.mock.calls[0][2].signal).toBe(controller.signal);
    expect(mockApi.get.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
