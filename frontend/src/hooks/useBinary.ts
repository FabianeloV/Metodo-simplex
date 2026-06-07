import { useCallback, useState } from "react";
import { binaryApi } from "../services/binaryApi";
import type { BinaryConstraint, BinaryResponse, Goal } from "../types/binary";
import type { VariableCount } from "../types/simplex";

interface UseBinaryState {
  result: BinaryResponse | null;
  loading: boolean;
  error: string | null;
}

export function useBinary() {
  const [state, setState] = useState<UseBinaryState>({
    result: null,
    loading: false,
    error: null,
  });

  const solve = useCallback(
    async (
      nVars: VariableCount,
      objCoeffs: number[],
      goal: Goal,
      constraints: BinaryConstraint[],
    ) => {
      setState({ result: null, loading: true, error: null });

      try {
        const result = await binaryApi.solve({
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
