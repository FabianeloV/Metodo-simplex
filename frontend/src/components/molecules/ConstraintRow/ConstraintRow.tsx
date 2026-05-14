import React from "react";
import { Input } from "../../atoms/Input";
import { Select } from "../../atoms/Select";
import { Button } from "../../atoms/Button";
import type { Constraint, Inequality } from "../../../types/simplex";
import styles from "./ConstraintRow.module.css";

interface ConstraintRowProps {
  index: number;
  nVars: number;
  constraint: Constraint;
  onCoefficientChange: (varIdx: number, value: number) => void;
  onInequalityChange: (ineq: Inequality) => void;
  onRhsChange: (value: number) => void;
  onRemove: () => void;
}

const INEQ_OPTIONS = [
  { value: "<=", label: "≤" },
  { value: ">=", label: "≥" },
  { value: "=",  label: "=" },
];

export const ConstraintRow: React.FC<ConstraintRowProps> = ({
  index,
  nVars,
  constraint,
  onCoefficientChange,
  onInequalityChange,
  onRhsChange,
  onRemove,
}) => (
  <div className={styles.row} role="group" aria-label={`Restricción ${index + 1}`}>
    <span className={styles.num}>#{index + 1}</span>

    {Array.from({ length: nVars }, (_, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className={styles.plus}>+</span>}
        <Input
          type="number"
          step="any"
          value={constraint.coefficients[i] ?? 1}
          onChange={(e) => onCoefficientChange(i, parseFloat(e.target.value) || 0)}
          aria-label={`Coeficiente x${i + 1} de la restricción ${index + 1}`}
        />
        <span className={styles.varLabel}>
          x<sub>{i + 1}</sub>
        </span>
      </React.Fragment>
    ))}

    <Select
      options={INEQ_OPTIONS}
      value={constraint.inequality}
      onChange={(e) => onInequalityChange(e.target.value as Inequality)}
      style={{ width: 56 }}
      aria-label="Signo de desigualdad"
    />

    <Input
      type="number"
      step="any"
      value={constraint.rhs}
      onChange={(e) => onRhsChange(parseFloat(e.target.value) || 0)}
      aria-label={`Lado derecho de la restricción ${index + 1}`}
      style={{ width: 72 }}
    />

    <Button
      variant="danger"
      size="sm"
      onClick={onRemove}
      aria-label={`Eliminar restricción ${index + 1}`}
      style={{ padding: "4px 8px" }}
    >
      ×
    </Button>
  </div>
);
