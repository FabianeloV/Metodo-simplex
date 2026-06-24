import { useCallback, useState } from "react";
import { newtonApi } from "../services/newtonApi";
import type { NewtonRequest, NewtonResponse } from "../types/newton";

interface UseNewtonState {
  result: NewtonResponse | null;
  loading: boolean;
  error: string | null;
}

export function useNewton() {
  const [state, setState] = useState<UseNewtonState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(async (payload: NewtonRequest) => {
    setState({ result: null, loading: true, error: null });
    try {
      const result = await newtonApi.solve(payload);
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
