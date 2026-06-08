import { useCallback, useState } from "react";
import { integerApi } from "../services/integerApi";
import type { IntegerConstraint, IntegerResponse, Goal } from "../types/integer";
import type { VariableCount } from "../types/simplex";

interface UseIntegerState {
  result: IntegerResponse | null;
  loading: boolean;
  error: string | null;
}

export function useInteger() {
  const [state, setState] = useState<UseIntegerState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(
    async (
      nVars: VariableCount,
      objCoeffs: number[],
      goal: Goal,
      constraints: IntegerConstraint[],
    ) => {
      setState({ result: null, loading: true, error: null });

      try {
        const result = await integerApi.solve({
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
          err instanceof Error ? err.message : "Ocurrió un error inesperado";
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
