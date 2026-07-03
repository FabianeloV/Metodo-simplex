import { useCallback, useState } from "react";
import { graphicalMultivarApi } from "../services/graphicalMultivarApi";
import type { GraphicalMultivarRequest, GraphicalMultivarResponse } from "../types/graphicalMultivar";

interface UseGraphicalMultivarState {
  result: GraphicalMultivarResponse | null;
  loading: boolean;
  error: string | null;
}

export function useGraphicalMultivar() {
  const [state, setState] = useState<UseGraphicalMultivarState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(async (payload: GraphicalMultivarRequest) => {
    setState({ result: null, loading: true, error: null });
    try {
      const result = await graphicalMultivarApi.solve(payload);
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
