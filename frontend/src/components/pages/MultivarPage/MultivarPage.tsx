import React, { useCallback, useState } from "react";
import { AppHeader }                from "../../organisms/AppHeader";
import { GradientForm }             from "../../organisms/GradientForm";
import { GradientSolutionDisplay }  from "../../organisms/GradientSolutionDisplay";
import { SolverTemplate }           from "../../templates/SolverTemplate";
import { SubTabGroup }              from "../../molecules/SubTabGroup";
import type { SubTab }              from "../../molecules/SubTabGroup";
import { useGradient }              from "../../../hooks/useGradient";
import type { Goal }                from "../../../types/gradient";

const SUB_TABS: SubTab[] = [
  { label: "Método del Gradiente", value: "gradiente" },
];

const DEFAULT_VAR_COUNT = 2;
const DEFAULT_EXPRESSION = "x**2 + y**2 - 4*x + 2*y";
const DEFAULT_X0 = [2, -1];

const DEFAULTS_BY_VARS: Record<number, { expression: string; x0: number[] }> = {
  2: { expression: "x**2 + y**2 - 4*x + 2*y",            x0: [2, -1]    },
  3: { expression: "x**2 + y**2 + z**2 - 2*x - 4*y - 6*z", x0: [0, 0, 0] },
};

interface MultivarPageProps {
  onHome: () => void;
}

export const MultivarPage: React.FC<MultivarPageProps> = ({ onHome }) => {
  const [subMethod, setSubMethod]       = useState<string>("gradiente");
  const [varCount, setVarCount]         = useState<number>(DEFAULT_VAR_COUNT);
  const [expression, setExpression]     = useState<string>(DEFAULT_EXPRESSION);
  const [x0, setX0]                     = useState<number[]>(DEFAULT_X0);
  const [goal, setGoal]                 = useState<Goal>("min");
  const [stepSize, setStepSize]         = useState<number>(0.1);
  const [tolerance, setTolerance]       = useState<number>(1e-6);
  const [maxIterations, setMaxIter]     = useState<number>(100);

  const { result, loading, error, solve, reset } = useGradient();

  const handleVarCountChange = useCallback((n: number) => {
    setVarCount(n);
    setExpression(DEFAULTS_BY_VARS[n].expression);
    setX0(DEFAULTS_BY_VARS[n].x0);
    reset();
  }, [reset]);

  const handleX0Change = useCallback((idx: number, value: number) => {
    setX0((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    reset();
  }, [reset]);

  const variables = ["x", "y", "z"].slice(0, varCount);

  const handleSolve = useCallback(() => {
    solve({
      expression,
      variables,
      x0: x0.slice(0, varCount),
      goal,
      step_size: stepSize > 0 ? stepSize : 0.1,
      tolerance: tolerance > 0 ? tolerance : 1e-6,
      max_iterations: maxIterations >= 1 ? maxIterations : 100,
    });
  }, [expression, variables, x0, varCount, goal, stepSize, tolerance, maxIterations, solve]);

  const renderForm = () => (
    <GradientForm
      varCount={varCount}
      expression={expression}
      x0={x0}
      goal={goal}
      stepSize={stepSize}
      tolerance={tolerance}
      maxIterations={maxIterations}
      loading={loading}
      onVarCountChange={handleVarCountChange}
      onExpressionChange={(v) => { setExpression(v); reset(); }}
      onX0Change={handleX0Change}
      onGoalChange={(g) => { setGoal(g); reset(); }}
      onStepSizeChange={setStepSize}
      onToleranceChange={setTolerance}
      onMaxIterationsChange={setMaxIter}
      onSolve={handleSolve}
    />
  );

  return (
    <SolverTemplate
      header={<AppHeader method="multivar" onHome={onHome} />}
      subNav={
        <SubTabGroup
          label="Método"
          tabs={SUB_TABS}
          value={subMethod}
          onChange={setSubMethod}
        />
      }
      objective={renderForm()}
      constraints={null}
      solution={
        <GradientSolutionDisplay result={result} loading={loading} error={error} />
      }
    />
  );
};
