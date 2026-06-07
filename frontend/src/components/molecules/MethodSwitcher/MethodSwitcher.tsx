import React from "react";
import styles from "./MethodSwitcher.module.css";

export type Method = "simplex" | "binary";

interface MethodSwitcherProps {
  value: Method;
  onChange: (m: Method) => void;
}

const METHODS: { label: string; value: Method; icon: string }[] = [
  { label: "Método Simplex", value: "simplex", icon: "Σ" },
  { label: "Entera Binaria", value: "binary", icon: "01" },
];

export const MethodSwitcher: React.FC<MethodSwitcherProps> = ({ value, onChange }) => (
  <nav className={styles.switcher} role="tablist" aria-label="Método de optimización">
    {METHODS.map((m) => (
      <button
        key={m.value}
        role="tab"
        aria-selected={value === m.value}
        className={[styles.tab, value === m.value ? styles.active : ""].join(" ")}
        onClick={() => onChange(m.value)}
      >
        <span className={styles.icon}>{m.icon}</span>
        {m.label}
      </button>
    ))}
  </nav>
);
