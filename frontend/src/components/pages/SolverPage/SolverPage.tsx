import React, { useCallback, useState } from "react";
import { AppHeader }        from "../../organisms/AppHeader";
import { ObjectiveForm }    from "../../organisms/ObjectiveForm";
import { ConstraintsForm }  from "../../organisms/ConstraintsForm";
import { SolutionDisplay }  from "../../organisms/SolutionDisplay";
import { SolverTemplate }   from "../../templates/SolverTemplate";
import { useConstraints }   from "../../../hooks/useConstraints";
import { useSimplex }       from "../../../hooks/useSimplex";
import type { Method }      from "../../molecules/MethodSwitcher";
import type { Goal, VariableCount } from "../../../types/simplex";

// ─── Default objective coefficients per variable count ───────────────────────
const DEFAULT_OBJ: Record<VariableCount, number[]> = {
  2: [3, 5],
  3: [3, 2, 5],
  4: [2, 3, 1, 4],
  5: [2, 3, 1, 4, 2],
};

interface SolverPageProps {
  onMethodChange: (m: Method) => void;
}

export const SolverPage: React.FC<SolverPageProps> = ({ onMethodChange }) => {
  const [nVars, setNVars]         = useState<VariableCount>(3);
  const [goal, setGoal]           = useState<Goal>("max");
  const [objCoeffs, setObjCoeffs] = useState<number[]>(DEFAULT_OBJ[3]);

  const { constraints, add, remove, updateCoefficient,
          updateInequality, updateRhs, resize, reset } = useConstraints(nVars, 3);

  const { result, loading, error, solve, reset: resetResult } = useSimplex();

  // ── Variable count change ──────────────────────────────────────────────────
  const handleVarsChange = useCallback((n: VariableCount) => {
    setNVars(n);
    setObjCoeffs(DEFAULT_OBJ[n]);
    resize(n);
    resetResult();
  }, [resize, resetResult]);

  // ── Objective coefficient change ───────────────────────────────────────────
  const handleObjCoeff = useCallback((idx: number, val: number) => {
    setObjCoeffs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  // ── Solve ──────────────────────────────────────────────────────────────────
  const handleSolve = useCallback(() => {
    solve(nVars, objCoeffs, goal, constraints);
  }, [nVars, objCoeffs, goal, constraints, solve]);

  return (
    <SolverTemplate
      header={
        <AppHeader
          method="simplex"
          onMethodChange={onMethodChange}
          nVars={nVars}
          onVarsChange={handleVarsChange}
        />
      }
      objective={
        <ObjectiveForm
          nVars={nVars}
          goal={goal}
          coefficients={objCoeffs}
          onGoalChange={setGoal}
          onCoefficientChange={handleObjCoeff}
        />
      }
      constraints={
        <ConstraintsForm
          nVars={nVars}
          constraints={constraints}
          loading={loading}
          onAdd={add}
          onRemove={remove}
          onCoefficientChange={updateCoefficient}
          onInequalityChange={updateInequality}
          onRhsChange={updateRhs}
          onSolve={handleSolve}
        />
      }
      solution={
        <SolutionDisplay
          nVars={nVars}
          result={result}
          loading={loading}
          error={error}
        />
      }
    />
  );
};
