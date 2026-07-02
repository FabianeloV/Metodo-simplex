import React, { useCallback, useState } from "react";
import { AppHeader }               from "../../organisms/AppHeader";
import { ObjectiveForm }           from "../../organisms/ObjectiveForm";
import { ConstraintsForm }         from "../../organisms/ConstraintsForm";
import { IntegerSolutionDisplay }  from "../../organisms/IntegerSolutionDisplay";
import { SolverTemplate }          from "../../templates/SolverTemplate";
import { useConstraints }          from "../../../hooks/useConstraints";
import { useInteger }              from "../../../hooks/useInteger";
import type { Goal, VariableCount } from "../../../types/simplex";

const DEFAULT_OBJ: Record<VariableCount, number[]> = {
  2: [1, 2],
  3: [1, 2, 3],
  4: [1, 2, 3, 4],
  5: [1, 2, 3, 4, 5],
};

interface IntegerPageProps {
  onHome: () => void;
}

export const IntegerPage: React.FC<IntegerPageProps> = ({ onHome }) => {
  const [nVars, setNVars]         = useState<VariableCount>(3);
  const [goal, setGoal]           = useState<Goal>("max");
  const [objCoeffs, setObjCoeffs] = useState<number[]>(DEFAULT_OBJ[3]);

  const { constraints, add, remove, updateCoefficient,
          updateInequality, updateRhs, resize, reset } = useConstraints(nVars, 3);

  const { result, loading, error, solve, reset: resetResult } = useInteger();

  const handleVarsChange = useCallback((n: VariableCount) => {
    setNVars(n);
    setObjCoeffs(DEFAULT_OBJ[n]);
    resize(n);
    resetResult();
  }, [resize, resetResult]);

  const handleObjCoeff = useCallback((idx: number, val: number) => {
    setObjCoeffs(prev => { const next = [...prev]; next[idx] = val; return next; });
  }, []);

  const handleSolve = useCallback(() => {
    solve(nVars, objCoeffs, goal, constraints);
  }, [nVars, objCoeffs, goal, constraints, solve]);

  return (
    <SolverTemplate
      header={
        <AppHeader
          method="integer"
          onHome={onHome}
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
          solveLabel="Resolver con Branch & Bound entero"
        />
      }
      solution={
        <IntegerSolutionDisplay
          nVars={nVars}
          result={result}
          loading={loading}
          error={error}
        />
      }
    />
  );
};
