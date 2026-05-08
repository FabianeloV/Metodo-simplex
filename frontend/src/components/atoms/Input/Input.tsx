import React from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({
  error = false,
  className = "",
  ...rest
}) => (
  <input
    className={[styles.input, error ? styles.error : "", className].join(" ")}
    {...rest}
  />
);
