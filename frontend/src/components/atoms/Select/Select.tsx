import React from "react";
import styles from "./Select.module.css";

interface SelectOption { value: string; label: string }

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  options,
  className = "",
  ...rest
}) => (
  <select className={[styles.select, className].join(" ")} {...rest}>
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);
