import React from "react";
import styles from "./SubTabGroup.module.css";

export interface SubTab {
  label: string;
  value: string;
}

interface SubTabGroupProps {
  label?: string;
  tabs: SubTab[];
  value: string;
  onChange: (value: string) => void;
}

export const SubTabGroup: React.FC<SubTabGroupProps> = ({
  label,
  tabs,
  value,
  onChange,
}) => (
  <div className={styles.bar}>
    {label && <span className={styles.barLabel}>{label}</span>}
    <nav className={styles.tabs} role="tablist" aria-label={label ?? "Submétodos"}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className={[styles.tab, value === t.value ? styles.active : ""].join(" ")}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  </div>
);
