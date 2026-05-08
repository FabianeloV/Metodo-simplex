import React from "react";
import styles from "./Badge.module.css";

type Color = "blue" | "green" | "red" | "gray";

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ color = "gray", children }) => (
  <span className={[styles.badge, styles[color]].join(" ")}>{children}</span>
);
