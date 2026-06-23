import { useCallback, useState } from "react";
import { bisectionApi } from "../services/bisectionApi";
import type { BisectionRequest, BisectionResponse } from "../types/bisection";

interface UseBisectionState {
  result: BisectionResponse | null;
  loading: boolean;
  error: string | null;
}

export function useBisection() {
  const [state, setState] = useState<UseBisectionState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(async (payload: BisectionRequest) => {
    setState({ result: null, loading: true, error: null });
    try {
      const result = await bisectionApi.solve(payload);
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
