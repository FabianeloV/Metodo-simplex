import React from "react";
import styles from "./MethodSwitcher.module.css";

export type Method = "simplex" | "binary" | "integer";

interface MethodSwitcherProps {
  value: Method;
  onChange: (m: Method) => void;
}

const METHODS: { label: string; value: Method; icon: string }[] = [
  { label: "Simplex",  value: "simplex",  icon: "Σ"  },
  { label: "Binaria",  value: "binary",   icon: "01" },
  { label: "Entera",   value: "integer",  icon: "IP" },
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
