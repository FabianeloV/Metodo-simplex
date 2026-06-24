import React from "react";
import { TabGroup } from "../../molecules/TabGroup";
import { MethodSwitcher } from "../../molecules/MethodSwitcher";
import type { Method } from "../../molecules/MethodSwitcher";
import type { VariableCount } from "../../../types/simplex";
import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  method: Method;
  onMethodChange: (m: Method) => void;
  nVars?: VariableCount;
  onVarsChange?: (n: VariableCount) => void;
}

const META: Record<Method, { title: string; sub: string; logo: string }> = {
  simplex:   { title: "Método Simplex",  sub: "Solver de Programación Lineal",                    logo: "Σ"  },
  binary:    { title: "Entera Binaria",  sub: "Branch & Bound — Variables 0/1",                   logo: "01" },
  integer:   { title: "Entera Pura",     sub: "Branch & Bound — Variables enteras ≥ 0",           logo: "IP" },
  bisection: { title: "No Restringida de una Variable",   sub: "Optimización sin restricciones de una sola variable",     logo: "ƒ" },
  multivar:  { title: "No Restringida de varias Variables", sub: "Optimización sin restricciones — múltiples variables", logo: "∇" },
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  method,
  onMethodChange,
  nVars,
  onVarsChange,
}) => {
  const meta = META[method];
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logoBox} aria-hidden="true">{meta.logo}</div>
        <div>
          <h1 className={styles.title}>{meta.title}</h1>
          <p className={styles.sub}>{meta.sub}</p>
        </div>
      </div>

      <div className={styles.controls}>
        <MethodSwitcher value={method} onChange={onMethodChange} />
        {nVars !== undefined && onVarsChange !== undefined && (
          <TabGroup value={nVars} onChange={onVarsChange} />
        )}
      </div>
    </header>
  );
};
