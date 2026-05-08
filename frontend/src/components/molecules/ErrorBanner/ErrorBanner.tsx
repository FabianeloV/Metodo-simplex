import React from "react";
import styles from "./ErrorBanner.module.css";

interface ErrorBannerProps { message: string }

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => (
  <div className={styles.banner} role="alert">
    <span className={styles.icon}>!</span>
    <p className={styles.msg}>{message}</p>
  </div>
);
