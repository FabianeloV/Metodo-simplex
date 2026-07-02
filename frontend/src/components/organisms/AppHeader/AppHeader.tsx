import React from "react";
import { TabGroup } from "../../molecules/TabGroup";
import { METHODS } from "../../../types/method";
import type { Method } from "../../../types/method";
import type { VariableCount } from "../../../types/simplex";
import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  method: Method;
  onHome: () => void;
  nVars?: VariableCount;
  onVarsChange?: (n: VariableCount) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  method,
  onHome,
  nVars,
  onVarsChange,
}) => {
  const meta = METHODS.find((m) => m.value === method)!;
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.brand}
          onClick={onHome}
          aria-label="Volver al menú principal"
        >
          <div className={styles.logoBox} aria-hidden="true">{meta.icon}</div>
          <div className={styles.brandText}>
            <h1 className={styles.title}>{meta.title}</h1>
            <p className={styles.sub}>{meta.sub}</p>
          </div>
        </button>

        {nVars !== undefined && onVarsChange !== undefined && (
          <TabGroup value={nVars} onChange={onVarsChange} />
        )}
      </div>
    </header>
  );
};
