import { useCallback, useState } from "react";
import { gradientApi } from "../services/gradientApi";
import type { GradientRequest, GradientResponse } from "../types/gradient";

interface UseGradientState {
  result: GradientResponse | null;
  loading: boolean;
  error: string | null;
}

export function useGradient() {
  const [state, setState] = useState<UseGradientState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(async (payload: GradientRequest) => {
    setState({ result: null, loading: true, error: null });
    try {
      const result = await gradientApi.solve(payload);
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
