import { useCallback, useState } from "react";
import type { Constraint, Inequality, VariableCount } from "../types/simplex";

let idCounter = 0;
const newId = () => `c_${++idCounter}`;

const makeConstraint = (nVars: VariableCount): Constraint => ({
  id: newId(),
  coefficients: Array<number>(nVars).fill(1),
  inequality: "<=",
  rhs: 100,
});

export function useConstraints(nVars: VariableCount, initial: number = 1) {
  const [constraints, setConstraints] = useState<Constraint[]>(() =>
    Array.from({ length: initial }, () => makeConstraint(nVars)),
  );

  const add = useCallback(() => {
    setConstraints((prev) => [...prev, makeConstraint(nVars)]);
  }, [nVars]);

  const remove = useCallback((id: string) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCoefficient = useCallback(
    (id: string, varIdx: number, value: number) => {
      setConstraints((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const coefficients = [...c.coefficients];
          coefficients[varIdx] = value;
          return { ...c, coefficients };
        }),
      );
    },
    [],
  );

  const updateInequality = useCallback((id: string, inequality: Inequality) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, inequality } : c)),
    );
  }, []);

  const updateRhs = useCallback((id: string, rhs: number) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rhs } : c)),
    );
  }, []);

  /** Resize coefficient arrays when nVars changes */
  const resize = useCallback((n: VariableCount) => {
    setConstraints((prev) =>
      prev.map((c) => {
        const coefficients = Array<number>(n)
          .fill(1)
          .map((_, i) => c.coefficients[i] ?? 1);
        return { ...c, coefficients };
      }),
    );
  }, []);

  return {
    constraints,
    add,
    remove,
    updateCoefficient,
    updateInequality,
    updateRhs,
    resize,
    reset: (n: VariableCount) => setConstraints([makeConstraint(n)]),
  };
}
