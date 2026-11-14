import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { foodScanService } from '../../services';
import { normalizeApiError } from '../../services/apiError';
import type { FoodScanDto, PageResponse, ScanEditBody } from '../../services/foodScanService';
import { queryKeys } from '../../services/queryKeys';

/** How a save ended, so the screen can say the right thing for each case. */
export type SaveOutcome =
  | { kind: 'saved'; scan: FoodScanDto }
  /** 404: the route does not exist on an older server. Edits stay on screen only. */
  | { kind: 'unsupported' }
  /** 409 twice (the scan changed, or this portion cannot be rescaled). */
  | { kind: 'conflict' }
  /** 400: the api refused a value (grams outside 1 to 5000, an unknown item). */
  | { kind: 'rejected' }
  /** Offline, timeout, server error. */
  | { kind: 'failed'; reason: 'offline' | 'timeout' | 'server' }
  | { kind: 'cancelled' };

/**
 * `PATCH /food-scans/{id}` with the one retry the contract asks for: a 409 means the scan changed
 * under us, so it is fetched again and the same correction is sent once more. A 401 never reaches
 * here (the api client renews the token or signs out).
 */
export async function saveScanEdits(
  scanId: string,
  body: ScanEditBody,
  signal?: AbortSignal
): Promise<SaveOutcome> {
  const attempt = async (): Promise<SaveOutcome | 'retry'> => {
    try {
      return { kind: 'saved', scan: await foodScanService.updateFoodScan(scanId, body, signal) };
    } catch (error) {
      const { kind, status } = normalizeApiError(error);
      if (kind === 'cancelled') return { kind: 'cancelled' };
      if (status === 404) return { kind: 'unsupported' };
      if (status === 409) return 'retry';
      if (status === 400) return { kind: 'rejected' };
      return {
        kind: 'failed',
        reason: kind === 'offline' ? 'offline' : kind === 'timeout' ? 'timeout' : 'server',
      };
    }
  };

  const first = await attempt();
  if (first !== 'retry') return first;
  try {
    await foodScanService.getFoodScan(scanId, signal);
  } catch {
    return { kind: 'conflict' };
  }
  const second = await attempt();
  return second === 'retry' ? { kind: 'conflict' } : second;
}

/**
 * Put a corrected scan into every cache that shows it, so Home and History show the new calories
 * without another request.
 */
export function applyScanToCaches(client: QueryClient, scan: FoodScanDto): void {
  client.setQueryData(queryKeys.scan(scan.id), scan);
  client.setQueryData<FoodScanDto[]>(queryKeys.scansRecent, (list) =>
    list?.map((item) => (item.id === scan.id ? scan : item))
  );
  client.setQueryData<InfiniteData<PageResponse<FoodScanDto>>>(queryKeys.scansHistory, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            content: page.content.map((item) => (item.id === scan.id ? scan : item)),
          })),
        }
      : data
  );
}
