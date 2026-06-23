import React from "react";
import { Input } from "../../atoms/Input";
import styles from "./ObjectiveRow.module.css";

const SUB: Record<number, string> = { 0: "₁", 1: "₂", 2: "₃", 3: "₄", 4: "₅" };

interface ObjectiveRowProps {
  nVars: number;
  coefficients: number[];
  onChange: (index: number, value: number) => void;
}

export const ObjectiveRow: React.FC<ObjectiveRowProps> = ({
  nVars,
  coefficients = [],
  onChange,
}) => (
  <div className={styles.row}>
    <span className={styles.zEq}>Z =</span>
    {Array.from({ length: nVars }, (_, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className={styles.plus}>+</span>}
        <Input
          type="number"
          step="any"
          value={coefficients[i] ?? 1}
          onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
          aria-label={`Coeficiente de x${i + 1}`}
        />
        <span className={styles.varLabel}>
          x<sub>{i + 1}</sub>
        </span>
      </React.Fragment>
    ))}
  </div>
);
