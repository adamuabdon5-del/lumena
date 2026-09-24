import { useCallback, useEffect, useRef, useState } from "react";

export interface WalletPolicy {
  walletId: string;
  [key: string]: unknown;
}

export interface UsePolicyResult {
  policy: WalletPolicy | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UsePolicyOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL = "";

/**
 * Reads a wallet's policy configuration from the server policy endpoint.
 *
 * @param walletId - The wallet whose policy should be fetched.
 * @param options - Optional base URL and fetch implementation overrides.
 */
export function usePolicy(
  walletId: string,
  options: UsePolicyOptions = {},
): UsePolicyResult {
  const { baseUrl = DEFAULT_BASE_URL, fetchImpl } = options;

  const [policy, setPolicy] = useState<WalletPolicy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(walletId));
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const fetchRef = useRef(fetchImpl);
  fetchRef.current = fetchImpl;

  useEffect(() => {
    if (!walletId) {
      setPolicy(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const doFetch = fetchRef.current ?? fetch;

    setIsLoading(true);
    setError(null);

    doFetch(`${baseUrl}/wallets/${encodeURIComponent(walletId)}/policy`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch policy for wallet ${walletId}: ${response.status}`,
          );
        }
        return (await response.json()) as WalletPolicy;
      })
      .then((data) => {
        if (cancelled) return;
        setPolicy(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [walletId, baseUrl, reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { policy, isLoading, error, refetch };
}
