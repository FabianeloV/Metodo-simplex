import React, { useCallback, useState } from "react";
import { AppHeader }                    from "../../organisms/AppHeader";
import { BisectionForm }               from "../../organisms/BisectionForm";
import { BisectionSolutionDisplay }    from "../../organisms/BisectionSolutionDisplay";
import { GraphicalSolutionDisplay }    from "../../organisms/GraphicalSolutionDisplay";
import { NewtonForm }                  from "../../organisms/NewtonForm";
import { NewtonSolutionDisplay }       from "../../organisms/NewtonSolutionDisplay";
import { SolverTemplate }              from "../../templates/SolverTemplate";
import { SubTabGroup }                 from "../../molecules/SubTabGroup";
import type { SubTab }                 from "../../molecules/SubTabGroup";
import { useBisection }                from "../../../hooks/useBisection";
import { useNewton }                   from "../../../hooks/useNewton";
import { solveGraphical }              from "../../../utils/graphical";
import type { GraphicalResult }        from "../../../utils/graphical";
import type { Goal }                   from "../../../types/bisection";

// Submétodos de optimización no restringida de una variable.
const SUB_TABS: SubTab[] = [
  { label: "Método de Bisección",      value: "biseccion" },
  { label: "Método de Newton",         value: "newton"    },
  { label: "Método Gráfico",           value: "grafico"   },
];

const DEFAULT_DEGREE = 2;
const DEFAULT_COEFFS = [1, -4, 3];

/** Redimensiona el arreglo de coeficientes preservándolos por potencia. */
function resizeCoeffs(
  coeffs: number[],
  oldDegree: number,
  newDegree: number,
): number[] {
  const byPower = new Map<number, number>();
  coeffs.forEach((c, idx) => byPower.set(oldDegree - idx, c));

  return Array.from({ length: newDegree + 1 }, (_, idx) => {
    const power = newDegree - idx;
    if (byPower.has(power)) return byPower.get(power)!;
    return power === newDegree ? 1 : 0;
  });
}

interface BisectionPageProps {
  onHome: () => void;
}

export const BisectionPage: React.FC<BisectionPageProps> = ({ onHome }) => {
  const [degree, setDegree]             = useState<number>(DEFAULT_DEGREE);
  const [coefficients, setCoefficients] = useState<number[]>(DEFAULT_COEFFS);
  const [goal, setGoal]                 = useState<Goal>("min");
  const [a, setA]                       = useState<number>(0);
  const [b, setB]                       = useState<number>(5);
  const [tolerance, setTolerance]       = useState<number>(1e-6);
  const [maxIterations, setMaxIter]     = useState<number>(100);
  const [subMethod, setSubMethod]       = useState<string>("biseccion");

  // Estado exclusivo del método de Newton
  const [x0, setX0]                     = useState<number>(1);
  const [newtonTol, setNewtonTol]       = useState<number>(1e-6);
  const [newtonMaxIter, setNewtonMaxIter] = useState<number>(100);

  const [graphResult, setGraphResult]   = useState<GraphicalResult | null>(null);
  const [graphError, setGraphError]     = useState<string | null>(null);

  const { result: bisResult, loading: bisLoading, error: bisError, solve: bisSolve, reset: bisReset } = useBisection();
  const { result: newResult, loading: newLoading, error: newError, solve: newSolve, reset: newReset } = useNewton();

  const isGraphical = subMethod === "grafico";
  const isNewton    = subMethod === "newton";

  const clearResults = useCallback(() => {
    setGraphResult(null);
    setGraphError(null);
    bisReset();
    newReset();
  }, [bisReset, newReset]);

  const handleDegreeChange = useCallback((d: number) => {
    setCoefficients((prev) => resizeCoeffs(prev, degree, d));
    setDegree(d);
    clearResults();
  }, [degree, clearResults]);

  const handleCoefficientChange = useCallback((idx: number, value: number) => {
    setCoefficients((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    clearResults();
  }, [clearResults]);

  const handleGoalChange = useCallback((g: Goal) => { setGoal(g); clearResults(); }, [clearResults]);
  const handleAChange    = useCallback((v: number) => { setA(v); clearResults(); }, [clearResults]);
  const handleBChange    = useCallback((v: number) => { setB(v); clearResults(); }, [clearResults]);

  const handleBisectionSolve = useCallback(() => {
    bisSolve({
      coefficients,
      goal,
      a,
      b,
      tolerance: tolerance > 0 ? tolerance : 1e-6,
      max_iterations: maxIterations >= 1 ? maxIterations : 100,
    });
  }, [coefficients, goal, a, b, tolerance, maxIterations, bisSolve]);

  const handleNewtonSolve = useCallback(() => {
    newSolve({
      coefficients,
      goal,
      x0,
      tolerance: newtonTol > 0 ? newtonTol : 1e-6,
      max_iterations: newtonMaxIter >= 1 ? newtonMaxIter : 100,
    });
  }, [coefficients, goal, x0, newtonTol, newtonMaxIter, newSolve]);

  const handleGraphicalSolve = useCallback(() => {
    try {
      setGraphResult(solveGraphical(coefficients, a, b, goal));
      setGraphError(null);
    } catch (e) {
      setGraphResult(null);
      setGraphError(e instanceof Error ? e.message : "Ocurrió un error inesperado");
    }
  }, [coefficients, a, b, goal]);

  const renderForm = () => {
    if (isNewton) {
      return (
        <NewtonForm
          degree={degree}
          coefficients={coefficients}
          goal={goal}
          x0={x0}
          tolerance={newtonTol}
          maxIterations={newtonMaxIter}
          loading={newLoading}
          onDegreeChange={handleDegreeChange}
          onCoefficientChange={handleCoefficientChange}
          onGoalChange={handleGoalChange}
          onX0Change={(v) => { setX0(v); clearResults(); }}
          onToleranceChange={setNewtonTol}
          onMaxIterationsChange={setNewtonMaxIter}
          onSolve={handleNewtonSolve}
        />
      );
    }

    if (isGraphical) {
      return (
        <BisectionForm
          degree={degree}
          coefficients={coefficients}
          goal={goal}
          a={a}
          b={b}
          loading={false}
          onDegreeChange={handleDegreeChange}
          onCoefficientChange={handleCoefficientChange}
          onGoalChange={handleGoalChange}
          onAChange={handleAChange}
          onBChange={handleBChange}
          onSolve={handleGraphicalSolve}
          showIterationParams={false}
          title="Función f(x)"
          description="Defina un polinomio de una variable de cualquier grado. Se traza f(x) sobre [a, b] y el óptimo se localiza comparando los puntos críticos con los extremos del intervalo."
          solveLabel="Trazar y resolver"
        />
      );
    }

    return (
      <BisectionForm
        degree={degree}
        coefficients={coefficients}
        goal={goal}
        a={a}
        b={b}
        tolerance={tolerance}
        maxIterations={maxIterations}
        loading={bisLoading}
        onDegreeChange={handleDegreeChange}
        onCoefficientChange={handleCoefficientChange}
        onGoalChange={handleGoalChange}
        onAChange={handleAChange}
        onBChange={handleBChange}
        onToleranceChange={setTolerance}
        onMaxIterationsChange={setMaxIter}
        onSolve={handleBisectionSolve}
      />
    );
  };

  const renderSolution = () => {
    if (isNewton) {
      return <NewtonSolutionDisplay result={newResult} loading={newLoading} error={newError} />;
    }
    if (isGraphical) {
      return <GraphicalSolutionDisplay result={graphResult} error={graphError} />;
    }
    return <BisectionSolutionDisplay result={bisResult} loading={bisLoading} error={bisError} />;
  };

  return (
    <SolverTemplate
      header={<AppHeader method="bisection" onHome={onHome} />}
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
