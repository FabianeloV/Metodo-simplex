import React from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import type { BisectionResponse } from "../../../types/bisection";
import styles from "./BisectionSolutionDisplay.module.css";

interface BisectionSolutionDisplayProps {
  result: BisectionResponse | null;
  loading: boolean;
  error: string | null;
}

function fmt(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return "—";
  const r = Number(n.toPrecision(digits));
  return Number.isInteger(r) ? String(r) : String(r);
}

function fmtSci(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n !== 0 && Math.abs(n) < 1e-3) return n.toExponential(2);
  return fmt(n);
}

export const BisectionSolutionDisplay: React.FC<BisectionSolutionDisplayProps> = ({
  result,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Aplicando el método de bisección…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const { optimal_x, optimal_value, nature, goal_satisfied } = result;

  return (
    <section className={styles.card} aria-labelledby="bisec-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="bisec-result-heading" className={styles.cardTitle}>
            {goal_satisfied ? "Solución: Óptimo Encontrado" : "Solución: Punto Estacionario"}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {goal_satisfied
          ? <Badge color="green">✓ {nature}</Badge>
          : <Badge color="blue">{nature}</Badge>}
      </div>

      <div className={styles.exprBlock}>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f(x)</span>
          <code className={styles.expr}>{result.function_str}</code>
        </div>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f′(x)</span>
          <code className={styles.expr}>{result.derivative_str}</code>
        </div>
      </div>

      {optimal_x !== null && optimal_value !== null && (
        <div className={styles.metrics}>
          <MetricCard label="x óptimo" value={fmt(optimal_x)} highlight />
          <MetricCard label="f(x)" value={fmt(optimal_value)} highlight />
          <MetricCard label="Naturaleza" value={nature ?? "—"} />
          <MetricCard label="Iteraciones" value={String(result.iterations_count)} />
        </div>
      )}

      {result.iterations.length > 0 && (
        <div className={styles.tableSection}>
          <p className={styles.sectionLabel}>Tabla de iteraciones</p>
          <div className={styles.wrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>a</th>
                  <th>b</th>
                  <th>x = (a+b)/2</th>
                  <th>f(x)</th>
                  <th>f′(x)</th>
                  <th>Ancho</th>
                </tr>
              </thead>
              <tbody>
                {result.iterations.map((it) => (
                  <tr key={it.iteration}>
                    <td className={styles.idxCell}>{it.iteration}</td>
                    <td>{fmt(it.a)}</td>
                    <td>{fmt(it.b)}</td>
                    <td className={styles.midCell}>{fmt(it.midpoint)}</td>
                    <td>{fmt(it.f_mid)}</td>
                    <td>{fmtSci(it.df_mid)}</td>
                    <td>{fmtSci(it.interval_width)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
