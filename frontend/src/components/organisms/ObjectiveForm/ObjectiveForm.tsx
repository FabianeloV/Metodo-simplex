import React from "react";
import { Label } from "../../atoms/Label";
import { Select } from "../../atoms/Select";
import { ObjectiveRow } from "../../molecules/ObjectiveRow";
import type { Goal, VariableCount } from "../../../types/simplex";
import styles from "./ObjectiveForm.module.css";

const GOAL_OPTIONS = [
  { value: "max", label: "Maximize" },
  { value: "min", label: "Minimize" },
];

interface ObjectiveFormProps {
  nVars: VariableCount;
  goal: Goal;
  coefficients: number[];
  onGoalChange: (g: Goal) => void;
  onCoefficientChange: (idx: number, value: number) => void;
}

export const ObjectiveForm: React.FC<ObjectiveFormProps> = ({
  nVars,
  goal,
  coefficients,
  onGoalChange,
  onCoefficientChange,
}) => (
  <section className={styles.card} aria-labelledby="obj-heading">
    <h2 id="obj-heading" className={styles.cardTitle}>Objective Function</h2>
    <p className={styles.cardSub}>
      Define the main function to optimize and choose the objective.
    </p>

    <div className={styles.body}>
      <div className={styles.goalBlock}>
        <Label htmlFor="goal-select">Optimization Goal</Label>
        <Select
          id="goal-select"
          options={GOAL_OPTIONS}
          value={goal}
          onChange={(e) => onGoalChange(e.target.value as Goal)}
          style={{ width: 140 }}
        />
      </div>

      <div className={styles.funcBlock}>
        <Label>Function (Z)</Label>
        <ObjectiveRow
          nVars={nVars}
          coefficients={coefficients}
          onChange={onCoefficientChange}
        />
      </div>
    </div>
  </section>
);
