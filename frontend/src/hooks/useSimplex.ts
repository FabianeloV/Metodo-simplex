import { useCallback, useState } from "react";
import { simplexApi } from "../services/simplexApi";
import type {
  Constraint,
  Goal,
  SimplexResponse,
  VariableCount,
} from "../types/simplex";

interface UseSolverState {
  result: SimplexResponse | null;
  loading: boolean;
  error: string | null;
}

export function useSimplex() {
  const [state, setState] = useState<UseSolverState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(
    async (
      nVars: VariableCount,
      objCoeffs: number[],
      goal: Goal,
      constraints: Constraint[],
    ) => {
      setState({ result: null, loading: true, error: null });

      try {
        const result = await simplexApi.solve({
          objective: objCoeffs.slice(0, nVars),
          goal,
          constraints: constraints.map((c) => ({
            coefficients: c.coefficients.slice(0, nVars),
            inequality: c.inequality,
            rhs: c.rhs,
          })),
        });
        setState({ result, loading: false, error: null });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected error occurred";
        setState({ result: null, loading: false, error: message });
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ result: null, loading: false, error: null });
  }, []);

  return { ...state, solve, reset };
}
