import React from "react";
import { Label } from "../../atoms/Label";
import { Input } from "../../atoms/Input";
import { Select } from "../../atoms/Select";
import { Button } from "../../atoms/Button";
import type { Goal } from "../../../types/bisection";
import styles from "./BisectionForm.module.css";

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

interface BisectionFormProps {
  degree: number;
  coefficients: number[];
  goal: Goal;
  a: number;
  b: number;
  tolerance: number;
  maxIterations: number;
  loading: boolean;
  onDegreeChange: (d: number) => void;
  onCoefficientChange: (idx: number, value: number) => void;
  onGoalChange: (g: Goal) => void;
  onAChange: (v: number) => void;
  onBChange: (v: number) => void;
  onToleranceChange: (v: number) => void;
  onMaxIterationsChange: (v: number) => void;
  onSolve: () => void;
}

export const BisectionForm: React.FC<BisectionFormProps> = ({
  degree,
  coefficients,
  goal,
  a,
  b,
  tolerance,
  maxIterations,
  loading,
  onDegreeChange,
  onCoefficientChange,
  onGoalChange,
  onAChange,
  onBChange,
  onToleranceChange,
  onMaxIterationsChange,
  onSolve,
}) => {
  const intervalValid = a < b;

  return (
    <section className={styles.card} aria-labelledby="bisec-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="bisec-heading" className={styles.cardTitle}>
            Función Objetivo f(x)
          </h2>
          <p className={styles.cardSub}>
            Defina un polinomio de una variable de cualquier grado. La bisección
            buscará el punto donde f′(x) = 0 dentro del intervalo.
          </p>
        </div>
        <div className={styles.degreeBlock}>
          <Label htmlFor="degree-select">Grado</Label>
          <Select
            id="degree-select"
            options={DEGREE_OPTIONS}
            value={String(degree)}
            onChange={(e) => onDegreeChange(Number(e.target.value))}
            style={{ width: 110 }}
          />
        </div>
      </div>

      {/* Editor de polinomio: coeficientes de mayor a menor grado */}
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

      {/* Parámetros del método */}
      <div className={styles.params}>
        <div className={styles.field}>
          <Label htmlFor="goal-select">Meta</Label>
          <Select
            id="goal-select"
            options={GOAL_OPTIONS}
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as Goal)}
            style={{ width: 130 }}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="a-input">Intervalo a</Label>
          <Input
            id="a-input"
            type="number"
            step="any"
            value={Number.isNaN(a) ? "" : a}
            error={!intervalValid}
            onChange={(e) => onAChange(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="b-input">Intervalo b</Label>
          <Input
            id="b-input"
            type="number"
            step="any"
            value={Number.isNaN(b) ? "" : b}
            error={!intervalValid}
            onChange={(e) => onBChange(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="tol-input">Tolerancia</Label>
          <Input
            id="tol-input"
            type="number"
            step="any"
            min={0}
            value={Number.isNaN(tolerance) ? "" : tolerance}
            onChange={(e) => onToleranceChange(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="iter-input">Máx. iteraciones</Label>
          <Input
            id="iter-input"
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

      {!intervalValid && (
        <p className={styles.hint}>El intervalo debe cumplir a &lt; b.</p>
      )}

      <div className={styles.toolbar}>
        <Button
          variant="primary"
          size="md"
          loading={loading}
          disabled={!intervalValid}
          onClick={onSolve}
          icon={<PlayIcon />}
        >
          Resolver por Bisección
        </Button>
      </div>
    </section>
  );
};
