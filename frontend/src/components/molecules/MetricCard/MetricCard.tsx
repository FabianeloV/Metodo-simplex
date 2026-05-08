import React from "react";
import styles from "./MetricCard.module.css";

interface MetricCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  highlight = false,
}) => (
  <div className={[styles.card, highlight ? styles.highlight : ""].join(" ")}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>{value}</span>
  </div>
);
