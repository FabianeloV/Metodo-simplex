import React from "react";
import { Button } from "../../atoms/Button";
import { ConstraintRow } from "../../molecules/ConstraintRow";
import type { Constraint, Inequality, VariableCount } from "../../../types/simplex";
import styles from "./ConstraintsForm.module.css";

interface ConstraintsFormProps {
  nVars: VariableCount;
  constraints: Constraint[];
  loading: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onCoefficientChange: (id: string, varIdx: number, value: number) => void;
  onInequalityChange: (id: string, ineq: Inequality) => void;
  onRhsChange: (id: string, value: number) => void;
  onSolve: () => void;
  solveLabel?: string;
}

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M6.75 1a.75.75 0 0 0-1.5 0v4.25H1a.75.75 0 0 0 0 1.5h4.25V11a.75.75 0 0 0 1.5 0V6.75H11a.75.75 0 0 0 0-1.5H6.75V1Z"/>
  </svg>
);

const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="5" height="5" rx="1"/>
    <rect x="9" y="2" width="5" height="5" rx="1" opacity=".6"/>
    <rect x="2" y="9" width="5" height="5" rx="1" opacity=".6"/>
    <rect x="9" y="9" width="5" height="5" rx="1"/>
  </svg>
);

export const ConstraintsForm: React.FC<ConstraintsFormProps> = ({
  nVars,
  constraints,
  loading,
  onAdd,
  onRemove,
  onCoefficientChange,
  onInequalityChange,
  onRhsChange,
  onSolve,
  solveLabel = "Resolver mediante Simplex",
}) => (
  <section className={styles.card} aria-labelledby="constr-heading">
    <div className={styles.sectionHeader}>
      <div>
        <h2 id="constr-heading" className={styles.cardTitle}>Restricciones</h2>
        <p className={styles.cardSub}>
          Añada las desigualdades lineales que limitan su función objetivo.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onAdd} icon={<PlusIcon />}>
        Añadir Restricción
      </Button>
    </div>

    <div className={styles.constraintList} role="list">
      {constraints.length === 0 ? (
        <p className={styles.empty}>
          Aún no hay restricciones. Añada al menos una para resolver.
        </p>
      ) : (
        constraints.map((c, i) => (
          <div key={c.id} role="listitem">
            <ConstraintRow
              index={i}
              nVars={nVars}
              constraint={c}
              onCoefficientChange={(varIdx, val) =>
                onCoefficientChange(c.id, varIdx, val)
              }
              onInequalityChange={(ineq) => onInequalityChange(c.id, ineq)}
              onRhsChange={(val) => onRhsChange(c.id, val)}
              onRemove={() => onRemove(c.id)}
            />
          </div>
        ))
      )}
    </div>

    <div className={styles.toolbar}>
      <Button
        variant="primary"
        size="md"
        loading={loading}
        disabled={constraints.length === 0}
        onClick={onSolve}
        icon={<GridIcon />}
      >
        {solveLabel}
      </Button>
    </div>
  </section>
);
