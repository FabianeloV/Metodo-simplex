import { useCallback, useState } from "react";
import { kktApi } from "../services/kktApi";
import type { KKTRequest, KKTResponse } from "../types/kkt";

interface UseKktState {
  result: KKTResponse | null;
  loading: boolean;
  error: string | null;
}

export function useKkt() {
  const [state, setState] = useState<UseKktState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(async (payload: KKTRequest) => {
    setState({ result: null, loading: true, error: null });
    try {
      const result = await kktApi.solve(payload);
      setState({ result, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error inesperado";
      setState({ result: null, loading: false, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ result: null, loading: false, error: null });
  }, []);

  return { ...state, solve, reset };
}
