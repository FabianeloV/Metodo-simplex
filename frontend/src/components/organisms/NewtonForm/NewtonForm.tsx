import React from "react";
import { Label } from "../../atoms/Label";
import { Input } from "../../atoms/Input";
import { Select } from "../../atoms/Select";
import { Button } from "../../atoms/Button";
import type { Goal } from "../../../types/newton";
import styles from "./NewtonForm.module.css";

const GOAL_OPTIONS = [
  { value: "max", label: "Maximizar" },
  { value: "min", label: "Minimizar" },
];

const DEGREE_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Grado ${i + 1}`,
}));

const SUPERSCRIPT: Record<number, string> = {
  0: "", 1: "", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸",
};

function termLabel(power: number): string {
  if (power === 0) return "";
  return `·x${SUPERSCRIPT[power] ?? "^" + power}`;
}

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 3.5v9a.75.75 0 0 0 1.14.64l7.5-4.5a.75.75 0 0 0 0-1.28l-7.5-4.5A.75.75 0 0 0 4 3.5Z" />
  </svg>
);

interface NewtonFormProps {
  degree: number;
  coefficients: number[];
  goal: Goal;
  x0: number;
  tolerance: number;
  maxIterations: number;
  loading: boolean;
  onDegreeChange: (d: number) => void;
  onCoefficientChange: (idx: number, value: number) => void;
  onGoalChange: (g: Goal) => void;
  onX0Change: (v: number) => void;
  onToleranceChange: (v: number) => void;
  onMaxIterationsChange: (v: number) => void;
  onSolve: () => void;
}

export const NewtonForm: React.FC<NewtonFormProps> = ({
  degree,
  coefficients,
  goal,
  x0,
  tolerance,
  maxIterations,
  loading,
  onDegreeChange,
  onCoefficientChange,
  onGoalChange,
  onX0Change,
  onToleranceChange,
  onMaxIterationsChange,
  onSolve,
}) => {
  return (
    <section className={styles.card} aria-labelledby="newton-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="newton-heading" className={styles.cardTitle}>
            Función Objetivo f(x)
          </h2>
          <p className={styles.cardSub}>
            Defina un polinomio de una variable. El método de Newton-Raphson buscará
            el punto donde f′(x) = 0 partiendo del punto inicial x₀, usando la
            iteración x₁ = x₀ − f′(x₀) / f″(x₀).
          </p>
        </div>
        <div className={styles.degreeBlock}>
          <Label htmlFor="newton-degree-select">Grado</Label>
          <Select
            id="newton-degree-select"
            options={DEGREE_OPTIONS}
            value={String(degree)}
            onChange={(e) => onDegreeChange(Number(e.target.value))}
            style={{ width: 110 }}
          />
        </div>
      </div>

      <div className={styles.polyEditor}>
        <span className={styles.fx}>f(x) =</span>
        {coefficients.map((c, idx) => {
          const power = degree - idx;
          return (
            <React.Fragment key={power}>
              {idx > 0 && <span className={styles.plus}>+</span>}
              <span className={styles.term}>
                <Input
                  type="number"
                  step="any"
                  value={Number.isNaN(c) ? "" : c}
                  onChange={(e) => onCoefficientChange(idx, Number(e.target.value))}
                  className={styles.coefInput}
                  aria-label={`Coeficiente de x elevado a ${power}`}
                />
                <span className={styles.power}>{termLabel(power)}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.params}>
        <div className={styles.field}>
          <Label htmlFor="newton-goal-select">Meta</Label>
          <Select
            id="newton-goal-select"
            options={GOAL_OPTIONS}
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as Goal)}
            style={{ width: 130 }}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="newton-x0-input">Punto inicial x₀</Label>
          <Input
            id="newton-x0-input"
            type="number"
            step="any"
            value={Number.isNaN(x0) ? "" : x0}
            onChange={(e) => onX0Change(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="newton-tol-input">Tolerancia</Label>
          <Input
            id="newton-tol-input"
            type="number"
            step="any"
            min={0}
            value={Number.isNaN(tolerance) ? "" : tolerance}
            onChange={(e) => onToleranceChange(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="newton-iter-input">Máx. iteraciones</Label>
          <Input
            id="newton-iter-input"
            type="number"
            step="1"
            min={1}
            max={500}
            value={Number.isNaN(maxIterations) ? "" : maxIterations}
            onChange={(e) => onMaxIterationsChange(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>
      </div>

      <div className={styles.toolbar}>
        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={onSolve}
          icon={<PlayIcon />}
        >
          Resolver por Newton
        </Button>
      </div>
    </section>
  );
};
