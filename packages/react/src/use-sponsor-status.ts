import { useCallback, useEffect, useRef, useState } from 'react';

export interface SponsorStatus {
  balance: number;
  currency: string;
  active: boolean;
  [key: string]: unknown;
}

export interface UseSponsorStatusOptions {
  /** Polling interval in milliseconds. Defaults to 30000 (30s). Set to 0 to disable polling. */
  pollInterval?: number;
  /** Base URL for the Lumen API. Defaults to the relative `/sponsor/status` path. */
  baseUrl?: string;
  /** Optional fetch implementation override (useful for tests). */
  fetcher?: typeof fetch;
}

export interface UseSponsorStatusResult {
  status: SponsorStatus | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_POLL_INTERVAL = 30_000;

export function useSponsorStatus(
  options: UseSponsorStatusOptions = {},
): UseSponsorStatusResult {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    baseUrl = '',
    fetcher,
  } = options;

  const [status, setStatus] = useState<SponsorStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const doFetch = fetcher ?? fetch;
      const response = await doFetch(`${baseUrl}/sponsor/status`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch sponsor status: ${response.status} ${response.statusText}`,
        );
      }
      const data = (await response.json()) as SponsorStatus;
      if (!mountedRef.current) return;
      setStatus(data);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [baseUrl, fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchStatus();

    if (pollInterval > 0) {
      const timer = setInterval(() => {
        void fetchStatus();
      }, pollInterval);
      return () => {
        mountedRef.current = false;
        clearInterval(timer);
      };
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchStatus, pollInterval]);

  return { status, isLoading, error, refetch: fetchStatus };
}
