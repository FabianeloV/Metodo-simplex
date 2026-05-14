import React from "react";
import styles from "./TabGroup.module.css";
import type { VariableCount } from "../../../types/simplex";

interface TabGroupProps {
  value: VariableCount;
  onChange: (n: VariableCount) => void;
}

const TABS: { label: string; value: VariableCount }[] = [
  { label: "2 Variables", value: 2 },
  { label: "3 Variables", value: 3 },
  { label: "4 Variables", value: 4 },
];

export const TabGroup: React.FC<TabGroupProps> = ({ value, onChange }) => (
  <nav className={styles.tabGroup} role="tablist" aria-label="Cantidad de variables">
    {TABS.map((tab) => (
      <button
        key={tab.value}
        role="tab"
        aria-selected={value === tab.value}
        className={[styles.tab, value === tab.value ? styles.active : ""].join(" ")}
        onClick={() => onChange(tab.value)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
);
