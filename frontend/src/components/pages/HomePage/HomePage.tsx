import React from "react";
import { METHODS } from "../../../types/method";
import type { Method } from "../../../types/method";
import styles from "./HomePage.module.css";

interface HomePageProps {
  onSelect: (m: Method) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelect }) => (
  <div className={styles.page}>
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.logoBox} aria-hidden="true">Σ</div>
        <h1 className={styles.title}>Método Simplex</h1>
        <p className={styles.sub}>Elegí un módulo de optimización para comenzar</p>
      </header>

      <div className={styles.grid}>
        {METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            className={styles.card}
            onClick={() => onSelect(m.value)}
          >
            <div className={styles.cardIcon} aria-hidden="true">{m.icon}</div>
            <h2 className={styles.cardTitle}>{m.label}</h2>
            <p className={styles.cardSub}>{m.sub}</p>
            <p className={styles.cardDesc}>{m.description}</p>
            <span className={styles.cardCta}>Abrir →</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
