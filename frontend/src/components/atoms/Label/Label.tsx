import React from "react";
import styles from "./Label.module.css";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children, className = "", ...rest }) => (
  <label className={[styles.label, className].join(" ")} {...rest}>
    {children}
  </label>
);
