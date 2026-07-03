import React from "react";
import { Label } from "../../atoms/Label";
import { Input } from "../../atoms/Input";
import { Select } from "../../atoms/Select";
import { Button } from "../../atoms/Button";
import type { Goal } from "../../../types/graphicalMultivar";
import styles from "./GraphicalMultivarForm.module.css";

const GOAL_OPTIONS = [
  { value: "min", label: "Minimizar" },
  { value: "max", label: "Maximizar" },
];

const VAR_COUNT_OPTIONS = [
  { value: "2", label: "2 variables (x, y)" },
  { value: "3", label: "3 variables (x, y, z)" },
];

const DEFAULTS: Record<number, { expression: string; bounds: number[][] }> = {
  2: { expression: "x**2 + y**2 - 4*x + 2*y", bounds: [[-5, 5], [-5, 5]] },
  3: { expression: "x**2 + y**2 + z**2 - 2*x - 4*y - 6*z", bounds: [[-5, 5], [-5, 5], [-5, 5]] },
};

const VAR_LABELS = ["x", "y", "z"];

const ChartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2a.5.5 0 0 1 .5.5V13h11.5a.5.5 0 0 1 0 1H2a.5.5 0 0 1-.5-.5V2.5A.5.5 0 0 1 2 2Z" />
    <path d="M14.5 4.5a.5.5 0 0 0-.85-.36l-3.65 3.6-2.15-2.1a.5.5 0 0 0-.7 0l-3.5 3.4a.5.5 0 1 0 .7.72l3.15-3.06 2.15 2.1a.5.5 0 0 0 .7 0l4-3.94a.5.5 0 0 0 .15-.36Z" />
  </svg>
);

interface GraphicalMultivarFormProps {
  varCount: number;
  expression: string;
  bounds: number[][];
  goal: Goal;
  loading: boolean;
  onVarCountChange: (n: number) => void;
  onExpressionChange: (v: string) => void;
  onBoundsChange: (idx: number, which: "min" | "max", value: number) => void;
  onGoalChange: (g: Goal) => void;
  onSolve: () => void;
}

export const GraphicalMultivarForm: React.FC<GraphicalMultivarFormProps> = ({
  varCount,
  expression,
  bounds,
  goal,
  loading,
  onVarCountChange,
  onExpressionChange,
  onBoundsChange,
  onGoalChange,
  onSolve,
}) => {
  const varNames = VAR_LABELS.slice(0, varCount);

  return (
    <section className={styles.card} aria-labelledby="graphical-multivar-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="graphical-multivar-heading" className={styles.cardTitle}>
            Función Objetivo f(x₁, …, xₙ)
          </h2>
          <p className={styles.cardSub}>
            Ingrese la función en notación Python (<code>**</code> para potencias). Se
            buscan los puntos críticos resolviendo ∇f = 0 dentro del dominio indicado, y se
            grafica la función en ese rango.
          </p>
        </div>
        <div className={styles.varBlock}>
          <Label htmlFor="graphical-var-select">Variables</Label>
          <Select
            id="graphical-var-select"
            options={VAR_COUNT_OPTIONS}
            value={String(varCount)}
            onChange={(e) => onVarCountChange(Number(e.target.value))}
            style={{ width: 180 }}
          />
        </div>
      </div>

      <div className={styles.exprEditor}>
        <span className={styles.fx}>f({varNames.join(", ")}) =</span>
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
          <Label htmlFor="graphical-goal-select">Meta</Label>
          <Select
            id="graphical-goal-select"
            options={GOAL_OPTIONS}
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as Goal)}
            style={{ width: 130 }}
          />
        </div>
      </div>

      <div className={styles.boundsGrid}>
        {varNames.map((v, idx) => (
          <div className={styles.boundRow} key={v}>
            <Label>Rango de {v}</Label>
            <div className={styles.boundInputs}>
              <Input
                type="number"
                step="any"
                value={Number.isNaN(bounds[idx]?.[0]) ? "" : bounds[idx]?.[0]}
                onChange={(e) => onBoundsChange(idx, "min", Number(e.target.value))}
                className={styles.numInput}
                aria-label={`${v} mínimo`}
              />
              <span className={styles.boundSep}>a</span>
              <Input
                type="number"
                step="any"
                value={Number.isNaN(bounds[idx]?.[1]) ? "" : bounds[idx]?.[1]}
                onChange={(e) => onBoundsChange(idx, "max", Number(e.target.value))}
                className={styles.numInput}
                aria-label={`${v} máximo`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={onSolve}
          icon={<ChartIcon />}
        >
          Graficar
        </Button>
      </div>
    </section>
  );
};
