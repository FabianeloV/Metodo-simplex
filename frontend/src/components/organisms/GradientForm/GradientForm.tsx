import React from "react";
import { Label } from "../../atoms/Label";
import { Input } from "../../atoms/Input";
import { Select } from "../../atoms/Select";
import { Button } from "../../atoms/Button";
import type { Goal } from "../../../types/gradient";
import styles from "./GradientForm.module.css";

const GOAL_OPTIONS = [
  { value: "min", label: "Minimizar" },
  { value: "max", label: "Maximizar" },
];

const VAR_COUNT_OPTIONS = [
  { value: "2", label: "2 variables (x, y)" },
  { value: "3", label: "3 variables (x, y, z)" },
];

const DEFAULTS: Record<number, { expression: string; x0: number[] }> = {
  2: { expression: "x**2 + y**2 - 4*x + 2*y", x0: [2, -1] },
  3: { expression: "x**2 + y**2 + z**2 - 2*x - 4*y - 6*z", x0: [0, 0, 0] },
};

const VAR_LABELS = ["x", "y", "z"];
const SUB_LABELS = ["₀", "₁", "₂"];

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 3.5v9a.75.75 0 0 0 1.14.64l7.5-4.5a.75.75 0 0 0 0-1.28l-7.5-4.5A.75.75 0 0 0 4 3.5Z" />
  </svg>
);

interface GradientFormProps {
  varCount: number;
  expression: string;
  x0: number[];
  goal: Goal;
  stepSize: number;
  tolerance: number;
  maxIterations: number;
  loading: boolean;
  onVarCountChange: (n: number) => void;
  onExpressionChange: (v: string) => void;
  onX0Change: (idx: number, v: number) => void;
  onGoalChange: (g: Goal) => void;
  onStepSizeChange: (v: number) => void;
  onToleranceChange: (v: number) => void;
  onMaxIterationsChange: (v: number) => void;
  onSolve: () => void;
}

export const GradientForm: React.FC<GradientFormProps> = ({
  varCount,
  expression,
  x0,
  goal,
  stepSize,
  tolerance,
  maxIterations,
  loading,
  onVarCountChange,
  onExpressionChange,
  onX0Change,
  onGoalChange,
  onStepSizeChange,
  onToleranceChange,
  onMaxIterationsChange,
  onSolve,
}) => {
  const varNames = VAR_LABELS.slice(0, varCount);

  return (
    <section className={styles.card} aria-labelledby="gradient-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="gradient-heading" className={styles.cardTitle}>
            Función Objetivo f(x₁, …, xₙ)
          </h2>
          <p className={styles.cardSub}>
            Ingrese la función en notación Python: use <code>**</code> para potencias y{" "}
            <code>*</code> para multiplicación. El gradiente se calcula simbólicamente y
            se aplica la regla x&#x207F;⁺¹ = x&#x207F; ∓ α·∇f(x&#x207F;).
          </p>
        </div>
        <div className={styles.varBlock}>
          <Label htmlFor="gradient-var-select">Variables</Label>
          <Select
            id="gradient-var-select"
            options={VAR_COUNT_OPTIONS}
            value={String(varCount)}
            onChange={(e) => onVarCountChange(Number(e.target.value))}
            style={{ width: 180 }}
          />
        </div>
      </div>

      <div className={styles.exprEditor}>
        <span className={styles.fx}>
          f({varNames.join(", ")}) =
        </span>
        <Input
          type="text"
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          className={styles.exprInput}
          placeholder={DEFAULTS[varCount].expression}
          aria-label="Expresión de la función"
          spellCheck={false}
        />
      </div>

      <div className={styles.params}>
        <div className={styles.field}>
          <Label htmlFor="gradient-goal-select">Meta</Label>
          <Select
            id="gradient-goal-select"
            options={GOAL_OPTIONS}
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as Goal)}
            style={{ width: 130 }}
          />
        </div>

        {varNames.map((v, idx) => (
          <div className={styles.field} key={v}>
            <Label htmlFor={`gradient-x0-${idx}`}>
              {v}{SUB_LABELS[0]} (punto inicial)
            </Label>
            <Input
              id={`gradient-x0-${idx}`}
              type="number"
              step="any"
              value={Number.isNaN(x0[idx]) ? "" : x0[idx]}
              onChange={(e) => onX0Change(idx, Number(e.target.value))}
              className={styles.numInput}
              aria-label={`Valor inicial de ${v}`}
            />
          </div>
        ))}

        <div className={styles.field}>
          <Label htmlFor="gradient-step-input">Tamaño de paso α</Label>
          <Input
            id="gradient-step-input"
            type="number"
            step="any"
            min={0}
            value={Number.isNaN(stepSize) ? "" : stepSize}
            onChange={(e) => onStepSizeChange(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="gradient-tol-input">Tolerancia</Label>
          <Input
            id="gradient-tol-input"
            type="number"
            step="any"
            min={0}
            value={Number.isNaN(tolerance) ? "" : tolerance}
            onChange={(e) => onToleranceChange(Number(e.target.value))}
            className={styles.numInput}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="gradient-iter-input">Máx. iteraciones</Label>
          <Input
            id="gradient-iter-input"
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
          Resolver por Gradiente
        </Button>
      </div>
    </section>
  );
};
