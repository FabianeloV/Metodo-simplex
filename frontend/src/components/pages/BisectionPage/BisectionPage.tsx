import React, { useCallback, useState } from "react";
import { AppHeader }                from "../../organisms/AppHeader";
import { BisectionForm }            from "../../organisms/BisectionForm";
import { BisectionSolutionDisplay } from "../../organisms/BisectionSolutionDisplay";
import { GraphicalSolutionDisplay } from "../../organisms/GraphicalSolutionDisplay";
import { SolverTemplate }           from "../../templates/SolverTemplate";
import { SubTabGroup }              from "../../molecules/SubTabGroup";
import type { SubTab }              from "../../molecules/SubTabGroup";
import { useBisection }             from "../../../hooks/useBisection";
import { solveGraphical }           from "../../../utils/graphical";
import type { GraphicalResult }     from "../../../utils/graphical";
import type { Method }              from "../../molecules/MethodSwitcher";
import type { Goal }                from "../../../types/bisection";

// Submétodos de optimización no restringida de una variable.
// Añadir aquí nuevos métodos (p. ej. Newton, sección áurea) creará otra sub-pestaña.
const SUB_TABS: SubTab[] = [
  { label: "Método de Bisección", value: "biseccion" },
  { label: "Método Gráfico",      value: "grafico"   },
];

// Polinomio por defecto: f(x) = x² - 4x + 3  (mínimo en x = 2)
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
    // El nuevo coeficiente líder arranca en 1 para que el grado sea real
    return power === newDegree ? 1 : 0;
  });
}

interface BisectionPageProps {
  onMethodChange: (m: Method) => void;
}

export const BisectionPage: React.FC<BisectionPageProps> = ({ onMethodChange }) => {
  const [degree, setDegree]             = useState<number>(DEFAULT_DEGREE);
  const [coefficients, setCoefficients] = useState<number[]>(DEFAULT_COEFFS);
  const [goal, setGoal]                 = useState<Goal>("min");
  const [a, setA]                       = useState<number>(0);
  const [b, setB]                       = useState<number>(5);
  const [tolerance, setTolerance]       = useState<number>(1e-6);
  const [maxIterations, setMaxIter]     = useState<number>(100);
  const [subMethod, setSubMethod]       = useState<string>("biseccion");

  // Resultado del método gráfico (se calcula en el cliente, sin backend)
  const [graphResult, setGraphResult]   = useState<GraphicalResult | null>(null);
  const [graphError, setGraphError]     = useState<string | null>(null);

  const { result, loading, error, solve, reset } = useBisection();

  const isGraphical = subMethod === "grafico";

  // Una entrada nueva invalida los resultados previos de ambos métodos
  const clearResults = useCallback(() => {
    setGraphResult(null);
    setGraphError(null);
    reset();
  }, [reset]);

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

  const handleSolve = useCallback(() => {
    solve({
      coefficients,
      goal,
      a,
      b,
      tolerance: tolerance > 0 ? tolerance : 1e-6,
      max_iterations: maxIterations >= 1 ? maxIterations : 100,
    });
  }, [coefficients, goal, a, b, tolerance, maxIterations, solve]);

  const handleGraphicalSolve = useCallback(() => {
    try {
      setGraphResult(solveGraphical(coefficients, a, b, goal));
      setGraphError(null);
    } catch (e) {
      setGraphResult(null);
      setGraphError(e instanceof Error ? e.message : "Ocurrió un error inesperado");
    }
  }, [coefficients, a, b, goal]);

  return (
    <SolverTemplate
      header={<AppHeader method="bisection" onMethodChange={onMethodChange} />}
      subNav={
        <SubTabGroup
          label="Método"
          tabs={SUB_TABS}
          value={subMethod}
          onChange={setSubMethod}
        />
      }
      objective={
        isGraphical ? (
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
        ) : (
          <BisectionForm
            degree={degree}
            coefficients={coefficients}
            goal={goal}
            a={a}
            b={b}
            tolerance={tolerance}
            maxIterations={maxIterations}
            loading={loading}
            onDegreeChange={handleDegreeChange}
            onCoefficientChange={handleCoefficientChange}
            onGoalChange={handleGoalChange}
            onAChange={handleAChange}
            onBChange={handleBChange}
            onToleranceChange={setTolerance}
            onMaxIterationsChange={setMaxIter}
            onSolve={handleSolve}
          />
        )
      }
      constraints={null}
      solution={
        isGraphical ? (
          <GraphicalSolutionDisplay result={graphResult} error={graphError} />
        ) : (
          <BisectionSolutionDisplay result={result} loading={loading} error={error} />
        )
      }
    />
  );
};
