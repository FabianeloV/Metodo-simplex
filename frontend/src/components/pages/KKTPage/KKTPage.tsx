import React, { useCallback, useState } from "react";
import { AppHeader }             from "../../organisms/AppHeader";
import { KKTObjectiveForm }      from "../../organisms/KKTObjectiveForm";
import { KKTConstraintsForm }    from "../../organisms/KKTConstraintsForm";
import { KKTSolutionDisplay }    from "../../organisms/KKTSolutionDisplay";
import { SolverTemplate }        from "../../templates/SolverTemplate";
import { useKkt }                from "../../../hooks/useKkt";
import { useKktConstraints }     from "../../../hooks/useKktConstraints";
import type { Goal, KKTInequality } from "../../../types/kkt";

interface DefaultsForVars {
  expression: string;
  constraints: { expression: string; inequality: KKTInequality; rhs: number }[];
}

const DEFAULTS_BY_VARS: Record<number, DefaultsForVars> = {
  2: {
    expression: "x**2 + y**2",
    constraints: [
      { expression: "x + y", inequality: ">=", rhs: 4 },
      { expression: "x", inequality: "<=", rhs: 10 },
    ],
  },
  3: {
    expression: "x**2 + y**2 + z**2",
    constraints: [
      { expression: "x + y + z", inequality: ">=", rhs: 6 },
      { expression: "x", inequality: "<=", rhs: 10 },
    ],
  },
};

interface KKTPageProps {
  onHome: () => void;
}

export const KKTPage: React.FC<KKTPageProps> = ({ onHome }) => {
  const [varCount, setVarCount]     = useState<number>(2);
  const [expression, setExpression] = useState<string>(DEFAULTS_BY_VARS[2].expression);
  const [goal, setGoal]             = useState<Goal>("min");

  const { constraints, add, remove, updateExpression, updateInequality, updateRhs, reset } =
    useKktConstraints(DEFAULTS_BY_VARS[2].constraints);

  const { result, loading, error, solve, reset: resetResult } = useKkt();

  const handleVarCountChange = useCallback((n: number) => {
    setVarCount(n);
    setExpression(DEFAULTS_BY_VARS[n].expression);
    reset(DEFAULTS_BY_VARS[n].constraints);
    resetResult();
  }, [reset, resetResult]);

  const variables = ["x", "y", "z"].slice(0, varCount);

  const handleSolve = useCallback(() => {
    solve({
      expression,
      variables,
      goal,
      constraints: constraints.map(({ expression: e, inequality, rhs }) => ({
        expression: e, inequality, rhs,
      })),
    });
  }, [expression, variables, goal, constraints, solve]);

  return (
    <SolverTemplate
      header={<AppHeader method="kkt" onHome={onHome} />}
      objective={
        <KKTObjectiveForm
          varCount={varCount}
          expression={expression}
          goal={goal}
          onVarCountChange={handleVarCountChange}
          onExpressionChange={(v) => { setExpression(v); resetResult(); }}
          onGoalChange={(g) => { setGoal(g); resetResult(); }}
        />
      }
      constraints={
        <KKTConstraintsForm
          constraints={constraints}
          loading={loading}
          onAdd={add}
          onRemove={remove}
          onExpressionChange={updateExpression}
          onInequalityChange={updateInequality}
          onRhsChange={updateRhs}
          onSolve={handleSolve}
        />
      }
      solution={
        <KKTSolutionDisplay result={result} loading={loading} error={error} />
      }
    />
  );
};
