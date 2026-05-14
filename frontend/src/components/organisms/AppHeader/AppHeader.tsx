import React from "react";
import { TabGroup } from "../../molecules/TabGroup";
import type { VariableCount } from "../../../types/simplex";
import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  nVars: VariableCount;
  onVarsChange: (n: VariableCount) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ nVars, onVarsChange }) => (
  <header className={styles.header}>
    <div className={styles.brand}>
      <div className={styles.logoBox} aria-hidden="true">Σ</div>
      <div>
        <h1 className={styles.title}>Optimización Simplex</h1>
        <p className={styles.sub}>Solver de Programación Lineal</p>
      </div>
    </div>
    <TabGroup value={nVars} onChange={onVarsChange} />
  </header>
);
