import React from "react";
import { Input } from "../../atoms/Input";
import { Select } from "../../atoms/Select";
import { Button } from "../../atoms/Button";
import type { KKTConstraint, KKTInequality } from "../../../types/kkt";
import styles from "./KKTConstraintsForm.module.css";

const INEQ_OPTIONS = [
  { value: "<=", label: "≤" },
  { value: ">=", label: "≥" },
  { value: "=",  label: "=" },
];

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

interface KKTConstraintRowProps {
  index: number;
  constraint: KKTConstraint;
  onExpressionChange: (v: string) => void;
  onInequalityChange: (ineq: KKTInequality) => void;
  onRhsChange: (v: number) => void;
  onRemove: () => void;
}

const KKTConstraintRow: React.FC<KKTConstraintRowProps> = ({
  index,
  constraint,
  onExpressionChange,
  onInequalityChange,
  onRhsChange,
  onRemove,
}) => (
  <div className={styles.row} role="group" aria-label={`Restricción ${index + 1}`}>
    <span className={styles.num}>g{index + 1}</span>

    <Input
      type="text"
      value={constraint.expression}
      onChange={(e) => onExpressionChange(e.target.value)}
      placeholder="x + y"
      className={styles.exprInput}
      aria-label={`Expresión de la restricción ${index + 1}`}
      spellCheck={false}
    />

    <Select
      options={INEQ_OPTIONS}
      value={constraint.inequality}
      onChange={(e) => onInequalityChange(e.target.value as KKTInequality)}
      style={{ width: 56 }}
      aria-label="Signo de desigualdad"
    />

    <Input
      type="number"
      step="any"
      value={constraint.rhs}
      onChange={(e) => onRhsChange(parseFloat(e.target.value) || 0)}
      aria-label={`Lado derecho de la restricción ${index + 1}`}
      style={{ width: 80 }}
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

interface KKTConstraintsFormProps {
  constraints: KKTConstraint[];
  loading: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onExpressionChange: (id: string, value: string) => void;
  onInequalityChange: (id: string, ineq: KKTInequality) => void;
  onRhsChange: (id: string, value: number) => void;
  onSolve: () => void;
}

export const KKTConstraintsForm: React.FC<KKTConstraintsFormProps> = ({
  constraints,
  loading,
  onAdd,
  onRemove,
  onExpressionChange,
  onInequalityChange,
  onRhsChange,
  onSolve,
}) => (
  <section className={styles.card} aria-labelledby="kkt-constr-heading">
    <div className={styles.sectionHeader}>
      <div>
        <h2 id="kkt-constr-heading" className={styles.cardTitle}>Restricciones</h2>
        <p className={styles.cardSub}>
          Defina g(x) para cada restricción, en notación Python. Las de igualdad
          (=) siempre están activas; las de desigualdad se evalúan en todas sus
          combinaciones posibles de activa/inactiva.
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
            <KKTConstraintRow
              index={i}
              constraint={c}
              onExpressionChange={(v) => onExpressionChange(c.id, v)}
              onInequalityChange={(ineq) => onInequalityChange(c.id, ineq)}
              onRhsChange={(v) => onRhsChange(c.id, v)}
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
        Resolver mediante KKT
      </Button>
    </div>
  </section>
);
