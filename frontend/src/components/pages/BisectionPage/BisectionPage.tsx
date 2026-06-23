import React, { useCallback, useState } from "react";
import { AppHeader }                from "../../organisms/AppHeader";
import { BisectionForm }            from "../../organisms/BisectionForm";
import { BisectionSolutionDisplay } from "../../organisms/BisectionSolutionDisplay";
import { SolverTemplate }           from "../../templates/SolverTemplate";
import { SubTabGroup }              from "../../molecules/SubTabGroup";
import type { SubTab }              from "../../molecules/SubTabGroup";
import { useBisection }             from "../../../hooks/useBisection";
import type { Method }              from "../../molecules/MethodSwitcher";
import type { Goal }                from "../../../types/bisection";

// Submétodos de optimización no restringida de una variable.
// Añadir aquí nuevos métodos (p. ej. Newton, sección áurea) creará otra sub-pestaña.
const SUB_TABS: SubTab[] = [
  { label: "Método de Bisección", value: "biseccion" },
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

  const { result, loading, error, solve, reset } = useBisection();

  const handleDegreeChange = useCallback((d: number) => {
    setCoefficients((prev) => resizeCoeffs(prev, degree, d));
    setDegree(d);
    reset();
  }, [degree, reset]);

  const handleCoefficientChange = useCallback((idx: number, value: number) => {
    setCoefficients((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);

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
          onGoalChange={setGoal}
          onAChange={setA}
          onBChange={setB}
          onToleranceChange={setTolerance}
          onMaxIterationsChange={setMaxIter}
          onSolve={handleSolve}
        />
      }
      constraints={null}
      solution={
        <BisectionSolutionDisplay
          result={result}
          loading={loading}
          error={error}
        />
      }
    />
  );
};
