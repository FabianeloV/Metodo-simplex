import { useCallback, useState } from "react";
import type { KKTConstraint, KKTInequality } from "../types/kkt";

let idCounter = 0;
const newId = () => `kc_${++idCounter}`;

const makeConstraint = (expression = "", inequality: KKTInequality = "<=", rhs = 0): KKTConstraint => ({
  id: newId(),
  expression,
  inequality,
  rhs,
});

export function useKktConstraints(initial: Omit<KKTConstraint, "id">[]) {
  const [constraints, setConstraints] = useState<KKTConstraint[]>(() =>
    initial.map((c) => makeConstraint(c.expression, c.inequality, c.rhs)),
  );

  const add = useCallback(() => {
    setConstraints((prev) => [...prev, makeConstraint()]);
  }, []);

  const remove = useCallback((id: string) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateExpression = useCallback((id: string, expression: string) => {
    setConstraints((prev) => prev.map((c) => (c.id === id ? { ...c, expression } : c)));
  }, []);

  const updateInequality = useCallback((id: string, inequality: KKTInequality) => {
    setConstraints((prev) => prev.map((c) => (c.id === id ? { ...c, inequality } : c)));
  }, []);

  const updateRhs = useCallback((id: string, rhs: number) => {
    setConstraints((prev) => prev.map((c) => (c.id === id ? { ...c, rhs } : c)));
  }, []);

  const reset = useCallback((next: Omit<KKTConstraint, "id">[]) => {
    setConstraints(next.map((c) => makeConstraint(c.expression, c.inequality, c.rhs)));
  }, []);

  return { constraints, add, remove, updateExpression, updateInequality, updateRhs, reset };
}
