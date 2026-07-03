import React from "react";
import { Label } from "../../atoms/Label";
import { Input } from "../../atoms/Input";
import { Select } from "../../atoms/Select";
import type { Goal } from "../../../types/kkt";
import styles from "./KKTObjectiveForm.module.css";

const GOAL_OPTIONS = [
  { value: "min", label: "Minimizar" },
  { value: "max", label: "Maximizar" },
];

const VAR_COUNT_OPTIONS = [
  { value: "2", label: "2 variables (x, y)" },
  { value: "3", label: "3 variables (x, y, z)" },
];

const DEFAULT_EXPRESSION: Record<number, string> = {
  2: "x**2 + y**2",
  3: "x**2 + y**2 + z**2",
};

const VAR_LABELS = ["x", "y", "z"];

interface KKTObjectiveFormProps {
  varCount: number;
  expression: string;
  goal: Goal;
  onVarCountChange: (n: number) => void;
  onExpressionChange: (v: string) => void;
  onGoalChange: (g: Goal) => void;
}

export const KKTObjectiveForm: React.FC<KKTObjectiveFormProps> = ({
  varCount,
  expression,
  goal,
  onVarCountChange,
  onExpressionChange,
  onGoalChange,
}) => {
  const varNames = VAR_LABELS.slice(0, varCount);

  return (
    <section className={styles.card} aria-labelledby="kkt-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="kkt-heading" className={styles.cardTitle}>
            Función Objetivo f(x₁, …, xₙ)
          </h2>
          <p className={styles.cardSub}>
            Ingrese la función en notación Python (<code>**</code> para potencias),
            sujeta a las restricciones indicadas abajo. Se analiza cada combinación
            de restricciones activas mediante las condiciones KKT.
          </p>
        </div>
        <div className={styles.varBlock}>
          <Label htmlFor="kkt-var-select">Variables</Label>
          <Select
            id="kkt-var-select"
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
          placeholder={DEFAULT_EXPRESSION[varCount]}
          aria-label="Expresión de la función"
          spellCheck={false}
        />
      </div>

      <div className={styles.params}>
        <div className={styles.field}>
          <Label htmlFor="kkt-goal-select">Meta</Label>
          <Select
            id="kkt-goal-select"
            options={GOAL_OPTIONS}
            value={goal}
            onChange={(e) => onGoalChange(e.target.value as Goal)}
            style={{ width: 130 }}
          />
        </div>
      </div>
    </section>
  );
};
