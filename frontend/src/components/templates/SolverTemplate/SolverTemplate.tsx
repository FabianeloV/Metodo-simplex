import React from "react";
import styles from "./SolverTemplate.module.css";

interface SolverTemplateProps {
  header: React.ReactNode;
  objective: React.ReactNode;
  constraints: React.ReactNode;
  solution: React.ReactNode;
}

export const SolverTemplate: React.FC<SolverTemplateProps> = ({
  header,
  objective,
  constraints,
  solution,
}) => (
  <div className={styles.page}>
    <div className={styles.container}>
      {header}
      {objective}
      {constraints}
      {solution}
    </div>
  </div>
);
