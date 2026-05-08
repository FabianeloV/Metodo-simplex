import React from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "ghost",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...rest
}) => (
  <button
    className={[styles.btn, styles[variant], styles[size], className].join(" ")}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? (
      <span className={styles.spinner} aria-label="loading" />
    ) : (
      icon && <span className={styles.icon}>{icon}</span>
    )}
    {children}
  </button>
);
