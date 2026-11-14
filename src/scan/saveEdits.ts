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
  /** 409 for a picked alternative the api cannot apply (no nutrition stored for it): rename instead. */
  | { kind: 'alternativeUnavailable' }
  /** 400: the api refused a value (grams outside 1 to 5000, an unknown item). */
  | { kind: 'rejected' }
  /** Offline, timeout, server error. */
  | { kind: 'failed'; reason: 'offline' | 'timeout' | 'server' }
  | { kind: 'cancelled' };

/** The api's 409 for an alternative it cannot apply (CONTRACTS 3.7) names the alternative. */
const ALTERNATIVE_REFUSED = /alternative/i;

/**
 * `PATCH /food-scans/{id}` with the one retry the contract asks for: a 409 means the scan changed
 * under us, so it is fetched again and the same correction is sent once more. A 409 that refuses a
 * picked alternative is not retried: the screen offers to rename the item instead. A 401 never reaches
 * here (the api client renews the token or signs out).
 */
export async function saveScanEdits(
  scanId: string,
  body: ScanEditBody,
  signal?: AbortSignal
): Promise<SaveOutcome> {
  const picksAlternative = (body.items ?? []).some((item) => item.alternativeClassId !== undefined);
  const attempt = async (): Promise<SaveOutcome | 'retry'> => {
    try {
      return { kind: 'saved', scan: await foodScanService.updateFoodScan(scanId, body, signal) };
    } catch (error) {
      const { kind, status, message } = normalizeApiError(error);
      if (kind === 'cancelled') return { kind: 'cancelled' };
      if (status === 404) return { kind: 'unsupported' };
      if (status === 409 && picksAlternative && ALTERNATIVE_REFUSED.test(message))
        return { kind: 'alternativeUnavailable' };
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
  if (second !== 'retry') return second;
  // Still 409 with an alternative in the request: that alternative is what the api refuses.
  return picksAlternative ? { kind: 'alternativeUnavailable' } : { kind: 'conflict' };
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
