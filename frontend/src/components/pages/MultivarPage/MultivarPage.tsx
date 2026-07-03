import React, { useCallback, useState } from "react";
import { AppHeader }                       from "../../organisms/AppHeader";
import { GradientForm }                    from "../../organisms/GradientForm";
import { GradientSolutionDisplay }         from "../../organisms/GradientSolutionDisplay";
import { GraphicalMultivarForm }           from "../../organisms/GraphicalMultivarForm";
import { GraphicalMultivarSolutionDisplay } from "../../organisms/GraphicalMultivarSolutionDisplay";
import { SolverTemplate }                  from "../../templates/SolverTemplate";
import { SubTabGroup }                     from "../../molecules/SubTabGroup";
import type { SubTab }                     from "../../molecules/SubTabGroup";
import { useGradient }                     from "../../../hooks/useGradient";
import { useGraphicalMultivar }            from "../../../hooks/useGraphicalMultivar";
import type { Goal }                       from "../../../types/gradient";

const SUB_TABS: SubTab[] = [
  { label: "Método del Gradiente", value: "gradiente" },
  { label: "Método Gráfico",       value: "grafico" },
];

const DEFAULT_VAR_COUNT = 2;
const DEFAULT_EXPRESSION = "x**2 + y**2 - 4*x + 2*y";
const DEFAULT_X0 = [2, -1];

const DEFAULTS_BY_VARS: Record<number, { expression: string; x0: number[] }> = {
  2: { expression: "x**2 + y**2 - 4*x + 2*y",            x0: [2, -1]    },
  3: { expression: "x**2 + y**2 + z**2 - 2*x - 4*y - 6*z", x0: [0, 0, 0] },
};

const GRAPH_DEFAULTS_BY_VARS: Record<number, { expression: string; bounds: number[][] }> = {
  2: { expression: "x**2 + y**2 - 4*x + 2*y",             bounds: [[-5, 5], [-5, 5]] },
  3: { expression: "x**2 + y**2 + z**2 - 2*x - 4*y - 6*z", bounds: [[-5, 5], [-5, 5], [-5, 5]] },
};

interface MultivarPageProps {
  onHome: () => void;
}

export const MultivarPage: React.FC<MultivarPageProps> = ({ onHome }) => {
  const [subMethod, setSubMethod]       = useState<string>("gradiente");

  // ── Estado del Método del Gradiente ────────────────────────────────────────
  const [varCount, setVarCount]         = useState<number>(DEFAULT_VAR_COUNT);
  const [expression, setExpression]     = useState<string>(DEFAULT_EXPRESSION);
  const [x0, setX0]                     = useState<number[]>(DEFAULT_X0);
  const [goal, setGoal]                 = useState<Goal>("min");
  const [stepSize, setStepSize]         = useState<number>(0.1);
  const [tolerance, setTolerance]       = useState<number>(1e-6);
  const [maxIterations, setMaxIter]     = useState<number>(100);

  const { result, loading, error, solve, reset } = useGradient();

  // ── Estado del Método Gráfico (independiente) ──────────────────────────────
  const [graphVarCount, setGraphVarCount] = useState<number>(DEFAULT_VAR_COUNT);
  const [graphExpression, setGraphExpression] = useState<string>(GRAPH_DEFAULTS_BY_VARS[DEFAULT_VAR_COUNT].expression);
  const [bounds, setBounds]               = useState<number[][]>(GRAPH_DEFAULTS_BY_VARS[DEFAULT_VAR_COUNT].bounds);
  const [graphGoal, setGraphGoal]         = useState<Goal>("min");

  const { result: graphResult, loading: graphLoading, error: graphError, solve: graphSolve, reset: graphReset } = useGraphicalMultivar();

  const isGraphical = subMethod === "grafico";

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

  // ── Handlers del Método Gráfico ─────────────────────────────────────────────
  const handleGraphVarCountChange = useCallback((n: number) => {
    setGraphVarCount(n);
    setGraphExpression(GRAPH_DEFAULTS_BY_VARS[n].expression);
    setBounds(GRAPH_DEFAULTS_BY_VARS[n].bounds);
    graphReset();
  }, [graphReset]);

  const handleBoundsChange = useCallback((idx: number, which: "min" | "max", value: number) => {
    setBounds((prev) => {
      const next = prev.map((pair) => [...pair]);
      next[idx][which === "min" ? 0 : 1] = value;
      return next;
    });
    graphReset();
  }, [graphReset]);

  const graphVariables = ["x", "y", "z"].slice(0, graphVarCount);

  const handleGraphSolve = useCallback(() => {
    graphSolve({
      expression: graphExpression,
      variables: graphVariables,
      bounds: bounds.slice(0, graphVarCount),
      goal: graphGoal,
    });
  }, [graphExpression, graphVariables, bounds, graphVarCount, graphGoal, graphSolve]);

  const renderForm = () => {
    if (isGraphical) {
      return (
        <GraphicalMultivarForm
          varCount={graphVarCount}
          expression={graphExpression}
          bounds={bounds}
          goal={graphGoal}
          loading={graphLoading}
          onVarCountChange={handleGraphVarCountChange}
          onExpressionChange={(v) => { setGraphExpression(v); graphReset(); }}
          onBoundsChange={handleBoundsChange}
          onGoalChange={(g) => { setGraphGoal(g); graphReset(); }}
          onSolve={handleGraphSolve}
        />
      );
    }

    return (
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
  };

  const renderSolution = () => {
    if (isGraphical) {
      return (
        <GraphicalMultivarSolutionDisplay result={graphResult} loading={graphLoading} error={graphError} />
      );
    }
    return <GradientSolutionDisplay result={result} loading={loading} error={error} />;
  };

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
      solution={renderSolution()}
    />
  );
};
